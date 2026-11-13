const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

const AUTH_PATHS = new Set(["/auth/login", "/auth/register", "/auth/logout", "/auth/refresh"]);

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

function buildUrl(path: string): string {
  if (!BASE_URL) throw new Error("Missing base URL env variable.");
  const base = BASE_URL.endsWith("/") ? BASE_URL.slice(0, -1) : BASE_URL;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalizedPath}`;
}

function redirectToLogin(): void {
  if (typeof window === "undefined") return;
  const { pathname } = window.location;
  if (pathname !== "/login" && pathname !== "/register") {
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.assign("/login");
  }
}

let refreshPromise: Promise<boolean> | null = null;

// Refresh handler. On success (true) = set new cookies, otherwise, (false) could not refresh
// Redirects to login page only when refresh token is explicitly rejected (401)
async function refreshSession(): Promise<boolean> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const res = await fetch(buildUrl("/auth/refresh"), {
        method: "POST",
        credentials: "include",
      });

      if (res.ok) return true;
      if (res.status === 401) redirectToLogin();

      return false;
    } catch {
      return false; // Network failure
    }
  })().finally(() => {
    refreshPromise = null; // Reset so user is not locked to making requests
  });

  return refreshPromise;
}

async function parseErrorMessage(response: Response): Promise<string> {
  let message = `API Fetch Error: ${response.status} ${response.statusText}`;

  // Get content type and verify
  const contentType = response.headers.get("content-type");
  if (contentType?.includes("application/json")) {
    try {
      const data = await response.json();
      if (typeof data?.detail === "string") {
        message = data.detail;
      } else if (Array.isArray(data?.detail)) {
        message = data.detail
          .map((e: { loc?: (string | number)[]; msg: string }) => {
            const field = e.loc?.[e.loc.length - 1];
            return field ? `${field}: ${e.msg}` : e.msg;
          })
          .join("; ");
      }
    } catch {
      // Fallback to the default error message
    }
  }

  return message;
}

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const url = buildUrl(path);
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  // Set default options config
  const hasJsonBody = options?.body != null && !(options.body instanceof FormData);
  const headers = new Headers(hasJsonBody ? { "Content-Type": "application/json" } : {});
  new Headers(options?.headers).forEach((value, key) => headers.set(key, value));

  const init: RequestInit = { credentials: "include", ...options, headers };

  let response = await fetch(url, init);

  if (response.status === 401 && !AUTH_PATHS.has(normalizedPath)) {
    if (await refreshSession()) {
      response = await fetch(url, init); // Resend once
      if (response.status === 401) redirectToLogin(); // If refreshed but still rejected (dead session)
    }
  }

  if (!response.ok) {
    throw new ApiError(await parseErrorMessage(response), response.status);
  }

  if (response.status === 204) return null as T;
  return response.json() as Promise<T>;
}
