const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000").replace(/\/$/, "")

export const apiUrl = (path: string) => `${API_URL}${path}`

export class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message)
  }
}

export async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...options?.headers },
  })
  const body = await response.json().catch(() => ({}))
  if (!response.ok) throw new ApiError(body.error ?? "Ocurrio un error", response.status)
  return body as T
}

export const queryString = (values: Record<string, string | number | undefined>) => {
  const params = new URLSearchParams()
  Object.entries(values).forEach(([key, value]) => {
    if (value !== undefined && value !== "") params.set(key, String(value))
  })
  const result = params.toString()
  return result ? `?${result}` : ""
}
