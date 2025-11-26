/**
 * @fileoverview This module initializes the Firebase app and configures authentication
 * providers for Google, GitHub, and Discord. It exports the Firebase authentication
 * instance and the provider configurations for use throughout the application.
 */

import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  OAuthProvider,
  GithubAuthProvider,
} from "firebase/auth";

/**
 * Firebase project configuration object.
 * The values are securely loaded from environment variables.
 *
 * @constant
 * @type {object}
 * @property {string} apiKey - Firebase API key used for authentication and security.
 * @property {string} authDomain - Domain for Firebase authentication.
 * @property {string} projectId - Firebase project identifier.
 * @property {string} storageBucket - Storage bucket associated with the Firebase project.
 * @property {string} messagingSenderId - Sender ID for Firebase Cloud Messaging.
 * @property {string} appId - Application ID used to identify the Firebase app instance.
 */
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

/**
 * Initializes the Firebase app instance using the provided configuration.
 *
 * @constant
 * @type {import("firebase/app").FirebaseApp}
 */
const app = initializeApp(firebaseConfig);

/**
 * Firebase Authentication instance used to manage user authentication.
 *
 * @constant
 * @type {import("firebase/auth").Auth}
 */
export const auth = getAuth(app);

/**
 * Google authentication provider instance for OAuth sign-in.
 *
 * @constant
 * @type {import("firebase/auth").GoogleAuthProvider}
 */
export const googleProvider = new GoogleAuthProvider();

/**
 * GitHub authentication provider instance for OAuth sign-in.
 *
 * @constant
 * @type {import("firebase/auth").GithubAuthProvider}
 */
export const githubProvider = new GithubAuthProvider();

/**
 * Discord authentication provider instance configured to use the "oidc.discord" provider.
 * Scopes are added to request user identity and email information.
 *
 * @constant
 * @type {import("firebase/auth").OAuthProvider}
 */
export const discordProvider = new OAuthProvider("oidc.discord");
discordProvider.addScope("identify");
discordProvider.addScope("email");
