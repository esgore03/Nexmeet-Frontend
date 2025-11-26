/**
 * @fileoverview This module provides a utility function to make HTTP requests to a backend API.
 * It supports `GET`, `POST`, `PUT`, and `DELETE` methods and handles query parameters,
 * request headers, and JSON payloads. The response is automatically parsed as JSON.
 */

/**
 * The base URL for all API requests.
 * Loaded from environment variables; defaults to an empty string if not defined.
 *
 * @constant
 * @type {string}
 */
const baseUrl = import.meta.env.VITE_BACKEND_URL ?? "";

/**
 * Supported HTTP methods for the request.
 *
 * @typedef {"GET" | "POST" | "PUT" | "DELETE"} Method
 */
type Method = "GET" | "POST" | "PUT" | "DELETE";
/**
 * Configuration options for making an HTTP request.
 *
 * @typedef {Object} RequestOptions
 * @property {Method} method - The HTTP method to use for the request.
 * @property {string} endpoint - The API endpoint (relative to the base URL).
 * @property {unknown} [data] - Optional data to include in the request body for POST and PUT requests.
 * @property {Record<string, string>} [params] - Optional query parameters to append to the URL.
 * @property {Record<string, string>} [headers] - Optional additional headers to include in the request.
 */

type RequestOptions = {
  method: Method;
  endpoint: string;
  data?: unknown;
  params?: Record<string, string>;
  headers?: Record<string, string>;
};
/**
 * Makes an HTTP request using the given options and returns the parsed JSON response.
 * Throws an error if the response is not successful.
 *
 * @template T
 * @async
 * @function
 * @param {RequestOptions} options - The options used to configure the HTTP request.
 * @returns {Promise<T>} A promise resolving to the parsed JSON response of the request.
 * @throws {Error} If the response status is not OK or if a network error occurs.
 *
 * @example
 * // Example usage:
 * const user = await request<User>({
 *   method: "GET",
 *   endpoint: "/users/1"
 * });
 */
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
