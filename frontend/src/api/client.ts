import {
  User,
  Drone,
  Geofence,
  Alert,
  Detection,
  DetectionAnalysisResult,
  Mission,
  MissionPlanResponse,
  AnalyticsSummary
} from "../types";

const API_BASE = "/api";

export function getToken(): string | null {
  return localStorage.getItem("skywatch_token");
}

export function setToken(token: string) {
  localStorage.setItem("skywatch_token", token);
}

export function clearToken() {
  localStorage.removeItem("skywatch_token");
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers = new Headers(options.headers || {});

  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  // Do not set Content-Type for FormData as browser sets boundary automatically
  if (!(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    clearToken();
    // Redirect to login if unauthenticated on protected routes
    if (window.location.pathname !== "/login") {
      window.location.href = "/login";
    }
    throw new Error("Authentication session expired.");
  }

  if (!response.ok) {
    let errMsg = "API Request Failed";
    try {
      const errData = await response.json();
      errMsg = errData.detail || errData.message || errMsg;
    } catch {
      errMsg = response.statusText;
    }
    throw new Error(errMsg);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

export const api = {
  auth: {
    login: (username: string, password: string) =>
      request<{ access_token: string; token_type: string; user: User }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      }),
    getMe: () => request<User>("/auth/me"),
  },

  drones: {
    list: () => request<Drone[]>("/drones"),
    get: (id: string) =>
      request<{ drone: Drone; history: any[] }>(`/drones/${id}`),
    create: (data: Partial<Drone>) =>
      request<Drone>("/drones", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: string, data: Partial<Drone>) =>
      request<Drone>(`/drones/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      request<void>(`/drones/${id}`, { method: "DELETE" }),
    command: (
      id: string,
      command: "return_to_base" | "pause" | "resume" | "goto" | "assign_route",
      params: { target_latitude?: number; target_longitude?: number; route?: number[][] } = {}
    ) =>
      request<{ status: string; message: string }>(`/drones/${id}/command`, {
        method: "POST",
        body: JSON.stringify({ command, ...params }),
      }),
  },

  geofences: {
    list: () => request<Geofence[]>("/geofences"),
    create: (data: {
      name: string;
      zone_type: string;
      description?: string;
      coordinates: number[][];
      min_altitude?: number;
      max_altitude?: number;
      is_active?: boolean;
    }) =>
      request<Geofence>("/geofences", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    delete: (id: number) =>
      request<void>(`/geofences/${id}`, { method: "DELETE" }),
  },

  alerts: {
    list: (params: { drone_id?: string; severity?: string; status?: string } = {}) => {
      const search = new URLSearchParams();
      if (params.drone_id) search.set("drone_id", params.drone_id);
      if (params.severity) search.set("severity", params.severity);
      if (params.status) search.set("status", params.status);
      const q = search.toString();
      return request<Alert[]>(`/alerts${q ? `?${q}` : ""}`);
    },
    acknowledge: (id: number) =>
      request<Alert>(`/alerts/${id}/ack`, {
        method: "PATCH",
        body: JSON.stringify({ acknowledged_by: "Tactical Operator" }),
      }),
    resolve: (id: number) =>
      request<Alert>(`/alerts/${id}/resolve`, {
        method: "PATCH",
        body: JSON.stringify({}),
      }),
  },

  detections: {
    list: (limit = 50) => request<Detection[]>(`/detections?limit=${limit}`),
    getSamples: () => request<{ samples: { id: string; name: string; path: string }[] }>("/detections/samples"),
    analyze: (formData: FormData) =>
      request<DetectionAnalysisResult>("/detections/analyze", {
        method: "POST",
        body: formData,
      }),
  },

  missions: {
    plan: (polygon: number[][], altitude = 60, overlap = 70, name = "Survey Sector") =>
      request<MissionPlanResponse>("/missions/plan", {
        method: "POST",
        body: JSON.stringify({ polygon, altitude, overlap_percentage: overlap, name }),
      }),
    save: (plan: MissionPlanResponse) =>
      request<Mission>("/missions", {
        method: "POST",
        body: JSON.stringify(plan),
      }),
    list: () => request<Mission[]>("/missions"),
    assign: (missionId: number, droneId: string) =>
      request<{ status: string; message: string }>(`/missions/${missionId}/assign`, {
        method: "POST",
        body: JSON.stringify({ drone_id: droneId }),
      }),
  },

  analytics: {
    summary: () => request<AnalyticsSummary>("/analytics/summary"),
  },

  export: {
    incidentsUrl: (format: "csv" | "geojson") => `${API_BASE}/export/incidents?format=${format}`,
  },
};
