import { toast } from "sonner";

export class ApiError extends Error {
  constructor(public status: number, message: string, public code?: string) {
    super(message);
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    credentials: "same-origin",
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    const message = data.message || data.error || "Request failed";
    toast.error(message);
    throw new ApiError(res.status, message, data.error);
  }

  if (res.headers.get("content-type")?.includes("json")) {
    return res.json();
  }
  return res as any;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: any) => request<T>(path, { method: "POST", body: JSON.stringify(body) }),
  put: <T>(path: string, body?: any) => request<T>(path, { method: "PUT", body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
  upload: async <T>(path: string, formData: FormData): Promise<T> => {
    const res = await fetch(path, { method: "POST", body: formData, credentials: "same-origin" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      const message = data.message || data.error || "Upload failed";
      toast.error(message);
      throw new ApiError(res.status, message);
    }
    return res.json();
  },
};
