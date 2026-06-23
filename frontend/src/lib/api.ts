const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

interface RequestOptions extends RequestInit {
  headers?: Record<string, string>;
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("devpilot_token") : null;
  
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorDetail = "An error occurred";
    try {
      const errJson = await response.json();
      errorDetail = errJson.detail || JSON.stringify(errJson);
    } catch {
      errorDetail = await response.text();
    }
    throw new Error(errorDetail);
  }

  // Handle empty responses
  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

export const api = {
  auth: {
    login: async (email: string, password: string) => {
      const data = await request<{ access_token: string; token_type: string }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      if (typeof window !== "undefined") {
        localStorage.setItem("devpilot_token", data.access_token);
      }
      return data;
    },
    register: async (email: string, password: string, fullName?: string) => {
      return request<any>("/auth/register", {
        method: "POST",
        body: JSON.stringify({ email, password, full_name: fullName }),
      });
    },
    logout: () => {
      if (typeof window !== "undefined") {
        localStorage.removeItem("devpilot_token");
      }
    },
    getCurrentUser: async () => {
      // In python, there's no direct route, but we can verify authentication via a simple route,
      // or check project listing to verify token validity. Let's make sure auth context is handled.
      // We can add a quick /auth/me route if we want, or just verify by loading projects.
      // Let's call /projects as a check.
      return request<any[]>("/projects", { method: "GET" });
    }
  },
  projects: {
    list: () => request<any[]>("/projects"),
    get: (id: number) => request<any>(`/projects/${id}`),
    create: (name: string, description: string, techStack?: string) =>
      request<any>("/projects", {
        method: "POST",
        body: JSON.stringify({ name, description, tech_stack: techStack }),
      }),
    generate: (id: number) =>
      request<any>(`/projects/${id}/generate`, {
        method: "POST",
      }),
    getArtifacts: (id: number) =>
      request<any[]>(`/projects/${id}/artifacts`),
    getChatHistory: (id: number) =>
      request<any[]>(`/projects/${id}/chat`),
    askAssistant: (id: number, query: string) =>
      request<{ answer: string; context: string }>(`/projects/${id}/chat`, {
        method: "POST",
        body: JSON.stringify({ query }),
      }),
    getExportUrl: (id: number) => {
      return `${API_BASE_URL}/projects/${id}/export`;
    }
  }
};
