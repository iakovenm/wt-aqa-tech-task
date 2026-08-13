/**
 * Expected copy shown by the application.
 *
 * Centralised so a wording change is a single edit instead of a search across
 * spec files.
 */

/** Password policy hints on the sign-up form, in render order. */
const PASSWORD_REQUIREMENTS = [
  'Min.8 characters',
  'Lowercase letter',
  'Uppercase letter',
  'At least 1 number',
];

/** Validation and error messages of the auth forms. */
const ERROR_MESSAGES = {
  invalidEmailFormat: 'Please enter correct email',
  requiredField: 'Please fill in this field to continue',
  invalidCredentials: 'The email address or password you entered is incorrect',
};

module.exports = { PASSWORD_REQUIREMENTS, ERROR_MESSAGES };
