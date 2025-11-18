// HTTP client to handle API requests to the backend
import { API_BASE_URL } from "./constants";

/**
 * HTTP client class responsible for making requests to the backend API.
 * Automatically handles authentication tokens, JSON parsing, and error handling.
 */
class HttpClient {
  /**
   * Base URL for all HTTP requests.
   * @type {string}
   */
  baseURL: string;

  /**
   * Initializes the HttpClient instance with a base API URL.
   */
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  /**
   * Makes a generic HTTP request to the given endpoint with the provided configuration.
   * Automatically includes the authentication token (if present) and parses JSON responses.
   *
   * @async
   * @param {string} endpoint - API endpoint relative to the base URL.
   * @param {RequestInit} [options={}] - Configuration options for the request (method, headers, body, etc.).
   * @returns {Promise<any>} Resolves with the parsed response data or rejects with an error.
   * @throws {Error} Throws an error if the request fails or returns a non-2xx status code.
   */
  public async request(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<any> {
    const url = `${this.baseURL}${endpoint}`;
    const config: RequestInit = {
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
      ...options,
    };

    // Add authentication token if available
    const token = localStorage.getItem("authToken");
    if (token && config.headers && typeof config.headers === "object") {
      (config.headers as Record<string, string>)[
        "Authorization"
      ] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, config);
      const contentType = response.headers.get("content-type") || "";

      // Handle HTTP errors
      if (!response.ok) {
        let backendMessage = "";
        let data: any = undefined;
        try {
          if (contentType.includes("application/json")) {
            data = await response.json();
            backendMessage =
              (data &&
                (data.message ||
                  data.error ||
                  (Array.isArray(data.errors) ? data.errors[0]?.msg : ""))) ||
              "";
          } else {
            backendMessage = await response.text();
          }
        } catch (_) {
          // Ignore JSON parsing errors
        }
        const err: any = new Error(
          backendMessage || `HTTP Error: ${response.status}`
        );
        err.status = response.status;
        if (data !== undefined) err.data = data;
        throw err;
      }

      // Handle 204 No Content
      if (response.status === 204) {
        return null;
      }

      // Parse response as JSON or text
      if (contentType.includes("application/json")) {
        return await response.json();
      }
      return await response.text();
    } catch (error) {
      console.error("HTTP request error:", error);
      throw error;
    }
  }

  /**
   * Sends a GET request to the specified endpoint.
   * @param {string} endpoint - The API endpoint to request.
   * @returns {Promise<any>} The parsed response data.
   */
  public get(endpoint: string): Promise<any> {
    return this.request(endpoint, { method: "GET" });
  }

  /**
   * Sends a POST request with JSON data to the specified endpoint.
   * @param {string} endpoint - The API endpoint to request.
   * @param {any} data - The payload to send in the request body.
   * @returns {Promise<any>} The parsed response data.
   */
  public post(endpoint: string, data: any): Promise<any> {
    return this.request(endpoint, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  /**
   * Sends a PUT request with JSON data to the specified endpoint.
   * @param {string} endpoint - The API endpoint to request.
   * @param {any} data - The payload to send in the request body.
   * @returns {Promise<any>} The parsed response data.
   */
  public put(endpoint: string, data: any): Promise<any> {
    return this.request(endpoint, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  /**
   * Sends a DELETE request to the specified endpoint.
   * @param {string} endpoint - The API endpoint to request.
   * @returns {Promise<any>} The parsed response data or null.
   */
  public delete(endpoint: string): Promise<any> {
    return this.request(endpoint, { method: "DELETE" });
  }
}

/**
 * Singleton instance of the HttpClient for global use.
 * @constant
 * @type {HttpClient}
 */
export const httpClient = new HttpClient();
