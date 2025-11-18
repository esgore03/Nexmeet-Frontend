/**
 * Validation helpers for forms (JSDoc in English).
 */

/**
 * Validates the user's age.
 * @param {string | number} age - The age to validate.
 * @returns {string | null} Returns an error message if invalid, or null if valid.
 */
export const validateAge = (age: string | number): string | null => {
  if (age === undefined || age === null || age === "")
    return "La edad es requerida";
  const num = typeof age === "number" ? age : Number(age);
  if (isNaN(num)) return "La edad debe ser un número válido";
  if (num < 13) return "Debes tener al menos 13 años";
  if (num > 120) return "La edad no puede ser mayor a 120";
  return null;
};

/**
 * Validates an email address.
 * @param {string} email - The email to validate.
 * @returns {string | null} Returns an error message if invalid, or null if valid.
 */
export const validateEmail = (email: string): string | null => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!email) {
    return "El email es requerido";
  }

  if (!emailRegex.test(email)) {
    return "El formato del email no es válido";
  }

  return null;
};

/**
 * Validates a password according to defined security rules.
 * @param {string} password - The password to validate.
 * @returns {string | null} Returns an error message if invalid, or null if valid.
 */
export const validatePassword = (password: string): string | null => {
  if (!password) {
    return "La contraseña es requerida";
  }
  if (/^\s+$/.test(password)) {
    return "La contraseña no puede ser solo espacios en blanco";
  }
  if (password.length < 8) {
    return "La contraseña debe tener al menos 8 caracteres";
  }
  if (!/[0-9]/.test(password)) {
    return "La contraseña debe contener al menos un número";
  }
  // Allowed special characters (excluding ' " ; \ /)
  const specialCharRegex = /[!@#$%^&*(),.?\:{}|<>\[\]\-_+=~`]/;
  if (!specialCharRegex.test(password)) {
    return "La contraseña debe contener al menos un caracter especial";
  }
  if (/[\/'"`;\\]/g.test(password)) {
    return "La contraseña no puede contener comillas, punto y coma, barra o contrabarra";
  }
  return null;
};

/**
 * Validates that the password confirmation matches the password.
 * @param {string} password - The original password.
 * @param {string} confirmPassword - The confirmation password.
 * @returns {string | null} Returns an error message if invalid, or null if valid.
 */
export const validatePasswordConfirmation = (
  password: string,
  confirmPassword: string
): string | null => {
  if (!confirmPassword) {
    return "Debes confirmar la contraseña";
  }

  if (password !== confirmPassword) {
    return "Las contraseñas no coinciden";
  }

  return null;
};

/**
 * Validates a user's name.
 * @param {string} name - The name to validate.
 * @returns {string | null} Returns an error message if invalid, or null if valid.
 */
export const validateName = (name: string): string | null => {
  if (!name) return "El nombre es requerido";
  if (name.length < 2) return "El nombre debe tener al menos 2 caracteres";
  if (name.length > 30) return "El nombre no puede tener más de 30 caracteres";
  return null;
};

/**
 * Login form data type.
 */
export type LoginFormData = {
  email: string;
  password: string;
};

/**
 * Validates the login form fields.
 * @param {LoginFormData} formData - The login form data.
 * @returns {{ isValid: boolean; errors: Record<string,string> }} Validation result and error messages.
 */
export const validateLoginForm = (
  formData: LoginFormData
): { isValid: boolean; errors: Record<string, string> } => {
  const errors: { [key: string]: string } = {};

  const emailError = validateEmail(formData.email);
  if (emailError) errors.email = emailError;

  const passwordError = validatePassword(formData.password);
  if (passwordError) errors.password = passwordError;

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

/**
 * Register form data type.
 */
export type RegisterFormData = {
  name: string;
  email: string;
  age: string;
  password: string;
  confirmPassword: string;
};

/**
 * Validates the registration form fields.
 * @param {RegisterFormData} formData - The registration form data.
 * @returns {{ isValid: boolean; errors: Record<string,string> }} Validation result and error messages.
 */
export const validateRegisterForm = (
  formData: RegisterFormData
): { isValid: boolean; errors: Record<string, string> } => {
  const errors: { [key: string]: string } = {};

  const nameError = validateName(formData.name);
  if (nameError) errors.name = nameError;

  const ageError = validateAge(formData.age);
  if (ageError) errors.age = ageError;

  const emailError = validateEmail(formData.email);
  if (emailError) errors.email = emailError;

  const passwordError = validatePassword(formData.password);
  if (passwordError) errors.password = passwordError;

  const confirmPasswordError = validatePasswordConfirmation(
    formData.password,
    formData.confirmPassword
  );
  if (confirmPasswordError) errors.confirmPassword = confirmPasswordError;

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};
