import json
from typing import Optional
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from backend.app.core.security import decode_access_token
from backend.app.services.simulator import simulator

router = APIRouter(tags=["WebSocket Real-Time Stream"])

class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        print(f"[WS] Client connected. Total active: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            print(f"[WS] Client disconnected. Total active: {len(self.active_connections)}")

    async def broadcast(self, message: dict):
        dead_connections = []
        for connection in list(self.active_connections):
            try:
                await connection.send_text(json.dumps(message))
            except Exception:
                dead_connections.append(connection)

        for dead in dead_connections:
            self.disconnect(dead)

manager = ConnectionManager()

# Hook manager broadcast into fleet simulator
async def on_simulator_broadcast(message: dict):
    await manager.broadcast(message)

simulator.register_broadcast_callback(on_simulator_broadcast)

@router.websocket("/ws/telemetry")
async def websocket_telemetry_endpoint(
    websocket: WebSocket,
    token: Optional[str] = Query(None)
):
    """
    Real-time high-frequency WebSocket stream for fleet telemetry (1Hz),
    tactical geofence breach alerts, and real-time AI object detections.
    """
    # Accept connection (token validation optional for seamless demo projector display)
    user_authenticated = False
    if token:
        payload = decode_access_token(token)
        if payload:
            user_authenticated = True

    await manager.connect(websocket)
    try:
        # Send initial confirmation message
        await websocket.send_text(json.dumps({
            "type": "CONNECTION_ESTABLISHED",
            "message": "Connected to SkyWatch Telemetry Stream",
            "authenticated": user_authenticated
        }))

        while True:
            # Keep receiving client heartbeats or messages
            data = await websocket.receive_text()
            try:
                msg = json.loads(data)
                if msg.get("type") == "PING":
                    await websocket.send_text(json.dumps({"type": "PONG"}))
            except Exception:
                pass
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        print(f"[WS ERROR] WebSocket connection error: {e}")
        manager.disconnect(websocket)
