const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  // Process env variable and verify
  if (!BASE_URL) {
    throw new Error("Missing base URL env variable.");
  }

  // Merge the URL cleanly, no double or missing slashes
  const sanitizedBase = BASE_URL.endsWith("/") ? BASE_URL.slice(0, -1) : BASE_URL;
  const sanitizedPath = path.startsWith("/") ? path : `/${path}`;
  const url = `${sanitizedBase}${sanitizedPath}`;

  // Set default options config
  const hasJsonBody = options?.body != null && !(options.body instanceof FormData);
  const defaultOptions: RequestInit = {
    credentials: "include",
    headers: hasJsonBody ? { "Content-Type": "application/json" } : {},
  };

  const mergedOptions: RequestInit = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options?.headers,
    },
  };

  // Fetch request and handle response
  const response = await fetch(url, mergedOptions);
  if (!response.ok) {
    let errorMessage = `API Fetch Error: ${response.status} ${response.statusText}`;

    // Get content type and verify
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      try {
        const errorData = await response.json();
        if (errorData && typeof errorData.detail === "string") {
          errorMessage = errorData.detail;
        } else if (errorData && Array.isArray(errorData.detail)) {
          errorMessage = errorData.detail
            .map((e: { loc?: (string | number)[]; msg: string }) => {
              const field = e.loc?.[e.loc.length - 1];
              return field ? `${field}: ${e.msg}` : e.msg;
            })
            .join("; ");
        }
      } catch {
        // Fallback to default message if JSON parsing fails
      }
    }
    throw new ApiError(errorMessage, response.status);
  }

  if (response.status === 204) {
    return null as T;
  }

  return response.json() as Promise<T>;
}
