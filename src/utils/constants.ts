// PopFix application configuration and constants

/**
 * Base URL for the API.
 * Replace this value with your backend URL if needed.
 * @constant {string}
 */
export const API_BASE_URL = "";

/**
 * API endpoint definitions for different functionalities.
 * @constant
 * @type {Object}
 * @property {string} LOGIN - Endpoint for user login.
 * @property {string} REGISTER - Endpoint for user registration.
 * @property {string} FORGOT_PASSWORD - Endpoint for password recovery.
 * @property {string} LOGOUT - Endpoint for logging out the user.

 */
export const API_ENDPOINTS = {
  // Autenticación
  LOGIN: "/users/login",
  REGISTER: "/users/register",
  FORGOT_PASSWORD: "/auth/forgot-password",
  LOGOUT: "/logout",
};

/**
 * General application configuration constants.
 * @constant
 * @type {Object}
 * @property {string} APP_NAME - Name of the application.
 * @property {string} DEFAULT_LANGUAGE - Default language of the app (ISO code).
 */
export const APP_CONFIG = {
  APP_NAME: "Nexmeet",
  DEFAULT_LANGUAGE: "es",
};
