// User authentication utility functions
import { httpClient } from "./httpClient";
import { API_ENDPOINTS } from "./constants";

/**
 * Represents the user login credentials.
 * @typedef {Object} LoginCredentials
 * @property {string} email - User's email address.
 * @property {string} password - User's password.
 */
export interface LoginCredentials {
  email: string;
  password: string;
}

/**
 * Represents a user entity.
 * @typedef {Object} User
 * @property {string} id - Unique identifier of the user.
 * @property {string} email - Email address of the user.
 * @property {string} [username] - Optional username.
 * @property {any} [key] - Additional user properties.
 */
export interface User {
  id: string;
  email: string;
  username?: string;
  [key: string]: any;
}

/**
 * Represents the response from a successful login.
 * @typedef {Object} LoginResponse
 * @property {string} token - Authentication token.
 * @property {User} user - Authenticated user information.
 */
export interface LoginResponse {
  token: string;
  user: User;
}

/**
 * Logs in a user using email and password credentials.
 * Saves the token and user data to localStorage.
 * @async
 * @param {LoginCredentials} credentials - User login credentials.
 * @returns {Promise<LoginResponse>} The login response containing token and user.
 * @throws {Error} If login fails.
 */
export const loginUser = async (
  credentials: LoginCredentials
): Promise<LoginResponse> => {
  try {
    const response = await httpClient.post(API_ENDPOINTS.LOGIN, credentials);
    if (response.token) {
      localStorage.setItem("authToken", response.token);
      localStorage.setItem("user", JSON.stringify(response.user));
    }
    return response;
  } catch (error: any) {
    throw new Error("Error logging in: " + (error.message || ""));
  }
};

/**
 * Registers a new user in the system.
 * @async
 * @param {{ name: string; email: string; age: number; password: string }} userData - User registration details.
 * @returns {Promise<any>} The response from the API.
 * @throws {Error} If registration fails.
 */
export const registerUser = async (userData: {
  name: string;
  email: string;
  age: number;
  password: string;
}): Promise<any> => {
  try {
    const response = await httpClient.post(API_ENDPOINTS.REGISTER, userData);
    return response;
  } catch (error: any) {
    throw new Error("Error registering user: " + (error.message || ""));
  }
};

/**
 * Sends a password recovery request to the backend.
 * @async
 * @param {{ email: string }} payload - Object containing the user's email.
 * @returns {Promise<any>} The response from the API.
 * @throws {Error} If password recovery request fails.
 */
export const forgotPassword = async (payload: {
  email: string;
}): Promise<any> => {
  try {
    const response = await httpClient.post(
      API_ENDPOINTS.FORGOT_PASSWORD,
      payload
    );
    return response;
  } catch (error: any) {
    throw new Error(
      "Error requesting password recovery: " + (error.message || "")
    );
  }
};

/**
 * Resets a user's password using a recovery token.
 * @async
 * @param {{ token: string; newPassword: string }} payload - The recovery token and new password.
 * @returns {Promise<any>} The response from the API.
 * @throws {Error} If reset operation fails.
 */
export const resetPassword = async (payload: {
  token: string;
  newPassword: string;
}): Promise<any> => {
  try {
    const response = await httpClient.post("/auth/reset-password", payload);
    return response;
  } catch (error: any) {
    throw new Error("Error resetting password: " + (error.message || ""));
  }
};

/**
 * Logs out the current user by calling the API and clearing localStorage.
 * @async
 * @returns {Promise<any>} The response from the API.
 * @throws {Error} If logout fails.
 */
export const logoutUser = async (): Promise<any> => {
  try {
    const response = await httpClient.post("/users/logout", {});
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
    return response;
  } catch (error: any) {
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
    throw new Error("Error logging out: " + (error.message || ""));
  }
};

/**
 * Checks if the user is currently authenticated.
 * @returns {boolean} True if a token exists, false otherwise.
 */
export const isAuthenticated = (): boolean => {
  const token = localStorage.getItem("authToken");
  return !!token;
};

/**
 * Retrieves the currently logged-in user's data from localStorage.
 * @returns {User|null} The current user or null if not logged in.
 */
export const getCurrentUser = (): User | null => {
  const user = localStorage.getItem("user");
  return user ? JSON.parse(user) : null;
};

/**
 * Fetches a user by ID from the backend and updates localStorage if necessary.
 * @async
 * @param {string} userId - The ID of the user to fetch.
 * @returns {Promise<User>} The fetched user data.
 * @throws {Error} If fetching fails.
 */
export const getUserById = async (userId: string): Promise<User> => {
  try {
    const response = await httpClient.get(`/users/${userId}`);
    if (response) {
      const currentUser = getCurrentUser();
      if (currentUser && currentUser.id === userId) {
        localStorage.setItem("user", JSON.stringify(response));
      }
    }
    return response;
  } catch (error: any) {
    throw new Error("Error fetching user: " + (error.message || ""));
  }
};

/**
 * Updates a user's information by ID.
 * Also updates localStorage if the updated user is the currently logged-in user.
 * @async
 * @param {string} userId - The ID of the user to update.
 * @param {any} updates - The user fields to update.
 * @returns {Promise<User>} The updated user.
 * @throws {Error} If update fails.
 */
export const updateUserById = async (
  userId: string,
  updates: any
): Promise<User> => {
  try {
    const response = await httpClient.put(`/users/${userId}`, updates);
    const currentUser = getCurrentUser();
    if (currentUser && currentUser.id === userId) {
      localStorage.setItem("user", JSON.stringify(response));
    }
    return response;
  } catch (error: any) {
    throw new Error("Error updating user: " + (error.message || ""));
  }
};

/**
 * Deletes a user by ID.
 * Clears localStorage if the deleted user is the currently logged-in user.
 * @async
 * @param {string} userId - The ID of the user to delete.
 * @returns {Promise<void>} Resolves when deletion is complete.
 * @throws {Error} If deletion fails.
 */
export const deleteUserById = async (userId: string): Promise<void> => {
  try {
    await httpClient.delete(`/users/${userId}`);
    const currentUser = getCurrentUser();
    if (currentUser && currentUser.id === userId) {
      localStorage.removeItem("authToken");
      localStorage.removeItem("user");
    }
  } catch (error: any) {
    throw new Error("Error deleting user: " + (error.message || ""));
  }
};

/**
 * Changes the user's password.
 * @async
 * @param {{ currentPassword: string; newPassword: string }} payload - Object containing current and new passwords.
 * @returns {Promise<any>} The response from the API.
 * @throws {Error} If password change fails.
 */
export const changePassword = async (payload: {
  currentPassword: string;
  newPassword: string;
}): Promise<any> => {
  try {
    const response = await httpClient.post("/users/change-password", payload);
    return response;
  } catch (error: any) {
    throw new Error(error.message || "Error changing password");
  }
};
