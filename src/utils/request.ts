const baseUrl = import.meta.env.VITE_BACKEND_URL ?? "";

type Method = "GET" | "POST" | "PUT" | "DELETE";

type RequestOptions = {
  method: Method;
  endpoint: string;
  data?: unknown;
  params?: Record<string, string>;
  headers?: Record<string, string>;
};

export async function request<T>(options: RequestOptions): Promise<T> {
  const url = new URL(`${baseUrl}${options.endpoint}`);

  if (options.params) {
    for (const key in options.params) {
      url.searchParams.append(key, String(options.params[key]));
    }
  }

  const response = await fetch(url.toString(), {
    method: options.method,
    headers: options.headers,
    body:
      options.method === "GET" || options.method === "DELETE"
        ? undefined
        : JSON.stringify(options.data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Error en la petición");
  }

  const json = await response.json();
  return json as T;
}
