import asyncio
import json
import math
import random
from datetime import datetime, timezone
from typing import Optional, Callable, Awaitable
from sqlalchemy.orm import Session
from backend.app.core.config import settings
from backend.app.db.session import SessionLocal
from backend.app.models.models import Drone, Geofence, TelemetrySample, Alert, Detection
from backend.app.services.geofence import haversine_distance_m, calculate_bearing_deg
from backend.app.services.alerts import AlertEngine

class FleetSimulator:
    """
    Real-time autonomous drone fleet simulator.
    Simulates physics, route navigation, battery decay, RF signal propagation,
    and looped tactical demo scenarios.
    """
    def __init__(self):
        self.is_running = False
        self._task: Optional[asyncio.Task] = None
        self._broadcast_callbacks: list[Callable[[dict], Awaitable[None]]] = []
        self._tick_counter = 0
        
        # Scenarios state
        self._scenario_signal_loss_timer = 0
        self._simulated_routes: dict[str, list[list[float]]] = {}
        self._route_indices: dict[str, int] = {}
        self._target_waypoints: dict[str, tuple[float, float]] = {}
        self._paused_drones: set[str] = set()

    def register_broadcast_callback(self, cb: Callable[[dict], Awaitable[None]]):
        """Add WebSocket listener for 1Hz telemetry broadcasts."""
        self._broadcast_callbacks.append(cb)

    def unregister_broadcast_callback(self, cb: Callable[[dict], Awaitable[None]]):
        if cb in self._broadcast_callbacks:
            self._broadcast_callbacks.remove(cb)

    async def broadcast(self, message: dict):
        """Broadcast message to all connected WebSocket clients."""
        for cb in list(self._broadcast_callbacks):
            try:
                await cb(message)
            except Exception:
                pass

    def start(self):
        """Start the 1Hz simulation loop task."""
        if not self.is_running:
            self.is_running = True
            self._task = asyncio.create_task(self._simulation_loop())
            print("[SIMULATOR] Drone Fleet Simulator started at 1Hz.")

    def stop(self):
        """Stop the simulation loop task."""
        self.is_running = False
        if self._task:
            self._task.cancel()
            self._task = None
            print("[SIMULATOR] Drone Fleet Simulator stopped.")

    # --- Operator Commands ---
    def command_return_to_base(self, drone_id: str, db: Session):
        drone = db.query(Drone).filter(Drone.id == drone_id).first()
        if drone:
            drone.status = "returning"
            self._target_waypoints[drone_id] = (settings.HQ_LATITUDE, settings.HQ_LONGITUDE)
            self._paused_drones.discard(drone_id)
            db.commit()

    def command_pause(self, drone_id: str, db: Session):
        drone = db.query(Drone).filter(Drone.id == drone_id).first()
        if drone:
            self._paused_drones.add(drone_id)
            drone.speed = 0.0
            db.commit()

    def command_resume(self, drone_id: str, db: Session):
        drone = db.query(Drone).filter(Drone.id == drone_id).first()
        if drone:
            self._paused_drones.discard(drone_id)
            if drone.status != "offline":
                drone.status = "active"
                drone.speed = round(random.uniform(9.0, 13.0), 1)
            db.commit()

    def command_goto(self, drone_id: str, target_lat: float, target_lon: float, db: Session):
        drone = db.query(Drone).filter(Drone.id == drone_id).first()
        if drone:
            drone.status = "active"
            self._paused_drones.discard(drone_id)
            self._target_waypoints[drone_id] = (target_lat, target_lon)
            # Recompute heading toward target
            drone.heading = calculate_bearing_deg(drone.latitude, drone.longitude, target_lat, target_lon)
            db.commit()

    def command_assign_route(self, drone_id: str, waypoints: list[list[float]], db: Session):
        drone = db.query(Drone).filter(Drone.id == drone_id).first()
        if drone and len(waypoints) >= 2:
            self._simulated_routes[drone_id] = waypoints
            self._route_indices[drone_id] = 0
            self._target_waypoints[drone_id] = (waypoints[0][0], waypoints[0][1])
            drone.assigned_route = json.dumps(waypoints)
            drone.status = "active"
            self._paused_drones.discard(drone_id)
            db.commit()

    # --- Core Simulation Loop ---
    async def _simulation_loop(self):
        while self.is_running:
            try:
                await asyncio.sleep(settings.SIMULATOR_INTERVAL_SECONDS)
                self._tick_counter += 1
                await self._tick()
            except asyncio.CancelledError:
                break
            except Exception as e:
                print(f"[SIMULATOR ERROR] Loop tick failed: {e}")
                await asyncio.sleep(1.0)

    async def _tick(self):
        db: Session = SessionLocal()
        try:
            drones = db.query(Drone).all()
            geofences = db.query(Geofence).filter(Geofence.is_active == True).all()
            
            drone_telemetry_payloads = []

            for drone in drones:
                # Handle paused state
                if drone.id in self._paused_drones:
                    drone.speed = 0.0
                else:
                    self._update_drone_position(drone)

                # Battery decay
                if drone.status != "offline":
                    drone.battery = max(0.0, round(drone.battery - random.uniform(0.02, 0.05), 2))
                    if drone.battery <= 20.0 and drone.status != "returning":
                        drone.status = "returning"
                        self._target_waypoints[drone.id] = (settings.HQ_LATITUDE, settings.HQ_LONGITUDE)
                
                # Signal fluctuation
                if drone.status != "offline":
                    fluctuation = random.choice([-2, -1, 0, 1, 2])
                    drone.signal_strength = min(100, max(20, drone.signal_strength + fluctuation))

                # Scripted Demo Scenarios on loops
                await self._handle_demo_scenarios(drone, db)

                # Evaluate Flight Safety Rules & Geofences
                new_alerts = AlertEngine.evaluate_drone_telemetry(drone, geofences, db)
                if new_alerts:
                    for alert in new_alerts:
                        await self.broadcast({
                            "type": "ALERT_NEW",
                            "alert": {
                                "id": alert.id,
                                "drone_id": alert.drone_id,
                                "alert_type": alert.alert_type,
                                "severity": alert.severity,
                                "message": alert.message,
                                "latitude": alert.latitude,
                                "longitude": alert.longitude,
                                "status": alert.status,
                                "created_at": alert.created_at.isoformat()
                            }
                        })

                # Record sample in DB (every 5 ticks to keep DB performant)
                if self._tick_counter % 5 == 0:
                    sample = TelemetrySample(
                        drone_id=drone.id,
                        latitude=drone.latitude,
                        longitude=drone.longitude,
                        altitude=drone.altitude,
                        speed=drone.speed,
                        heading=drone.heading,
                        battery=drone.battery,
                        signal_strength=drone.signal_strength,
                        status=drone.status
                    )
                    db.add(sample)

                drone_telemetry_payloads.append({
                    "id": drone.id,
                    "name": drone.name,
                    "model": drone.model,
                    "status": drone.status,
                    "latitude": round(drone.latitude, 6),
                    "longitude": round(drone.longitude, 6),
                    "altitude": round(drone.altitude, 1),
                    "speed": round(drone.speed, 1),
                    "heading": round(drone.heading, 1),
                    "battery": round(drone.battery, 1),
                    "signal_strength": drone.signal_strength,
                    "current_mission_id": drone.current_mission_id,
                    "updated_at": datetime.now(timezone.utc).isoformat()
                })

            db.commit()

            # Broadcast live fleet telemetry over WebSocket
            await self.broadcast({
                "type": "FLEET_TELEMETRY",
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "drones": drone_telemetry_payloads
            })

        finally:
            db.close()

    def _update_drone_position(self, drone: Drone):
        """Interpolate smooth physical drone movement towards current waypoint."""
        # Check target waypoint
        target = self._target_waypoints.get(drone.id)
        
        # If no explicit target, fetch from assigned route
        if not target and drone.assigned_route:
            try:
                route = json.loads(drone.assigned_route)
                idx = self._route_indices.get(drone.id, 0)
                if route and len(route) > 0:
                    target = (route[idx % len(route)][0], route[idx % len(route)][1])
                    self._target_waypoints[drone.id] = target
            except Exception:
                pass

        if not target:
            return

        dist_m = haversine_distance_m(drone.latitude, drone.longitude, target[0], target[1])
        
        # If reached waypoint (within 15m), move to next waypoint on route
        if dist_m <= 15.0:
            if drone.status == "returning":
                drone.status = "active"
                drone.battery = 100.0  # Autonomous recharge at base!
                self._target_waypoints.pop(drone.id, None)
                return
                
            if drone.assigned_route:
                try:
                    route = json.loads(drone.assigned_route)
                    current_idx = self._route_indices.get(drone.id, 0)
                    next_idx = (current_idx + 1) % len(route)
                    self._route_indices[drone.id] = next_idx
                    target = (route[next_idx][0], route[next_idx][1])
                    self._target_waypoints[drone.id] = target
                except Exception:
                    pass

        # Calculate bearing
        heading = calculate_bearing_deg(drone.latitude, drone.longitude, target[0], target[1])
        drone.heading = heading

        # Step distance in 1 second: speed in m/s (8 - 15 m/s)
        speed = max(drone.speed, 10.0)
        step_m = min(speed, dist_m)
        
        # Convert meters step to lat/lon offsets
        heading_rad = math.radians(heading)
        delta_north = step_m * math.cos(heading_rad)
        delta_east = step_m * math.sin(heading_rad)

        lat_deg_per_m = 1.0 / 111139.0
        lon_deg_per_m = 1.0 / (111139.0 * math.cos(math.radians(drone.latitude)))

        drone.latitude += delta_north * lat_deg_per_m
        drone.longitude += delta_east * lon_deg_per_m
        drone.speed = round(speed + random.uniform(-0.4, 0.4), 1)

    async def _handle_demo_scenarios(self, drone: Drone, db: Session):
        """
        Execute looped demo scenarios:
        1. Drone-03 enters Charminar restricted zone periodically
        2. Drone-05 experiences a 10s signal blackout every ~90 seconds
        3. Spontaneous aerial detection event every 60s
        """
        # Scenario 1: DRONE-03 enters restricted zone around tick 45-60
        if drone.id == "DRONE-03" and (self._tick_counter % 90 == 35):
            # Divert toward Charminar restricted coordinates
            self._target_waypoints[drone.id] = (17.3605, 78.4750)

        # Scenario 2: DRONE-05 loses signal for 10s
        if drone.id == "DRONE-05":
            if (self._tick_counter % 90) in range(65, 75):
                drone.signal_strength = 0
                drone.status = "offline"
            elif (self._tick_counter % 90) == 75:
                drone.signal_strength = 94
                drone.status = "active"

        # Scenario 3: Auto detection event broadcast every 45 ticks
        if self._tick_counter % 50 == 25 and drone.id == "DRONE-01":
            det = Detection(
                drone_id=drone.id,
                image_path="/sample_data/aerial_images/aerial_sample_1.jpg",
                class_name=random.choice(["person", "vehicle", "car", "truck"]),
                confidence=round(random.uniform(0.85, 0.96), 2),
                bbox_x1=200.0,
                bbox_y1=150.0,
                bbox_x2=320.0,
                bbox_y2=280.0,
                latitude=round(drone.latitude + random.uniform(-0.0005, 0.0005), 6),
                longitude=round(drone.longitude + random.uniform(-0.0005, 0.0005), 6),
                is_mock=True,
                timestamp=datetime.now(timezone.utc)
            )
            db.add(det)
            db.commit()
            db.refresh(det)
            
            await self.broadcast({
                "type": "DETECTION_NEW",
                "detection": {
                    "id": det.id,
                    "drone_id": det.drone_id,
                    "class_name": det.class_name,
                    "confidence": det.confidence,
                    "latitude": det.latitude,
                    "longitude": det.longitude,
                    "timestamp": det.timestamp.isoformat()
                }
            })

simulator = FleetSimulator()
