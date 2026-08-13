/**
 * Invalid log-in datasets.
 *
 * The specs iterate over these arrays, so covering a new case means adding an
 * entry here — no new test code.
 */

const { ERROR_MESSAGES } = require('./expected-content');
const { generateEmail, generatePassword } = require('./test-data-generator');

/**
 * Cases rejected client-side: the inline field error appears and the submit
 * button stays disabled, so no request is sent.
 *
 * `field` is the name of the {@link LoginPage} property that must show the error,
 * so a spec can look it up directly instead of branching per case.
 *
 * @type {Array<{title: string, email: string, password: string, field: 'emailField'|'passwordField', expectedError: string}>}
 */
const CLIENT_SIDE_INVALID_CREDENTIALS = [
  {
    title: 'email without an @ sign',
    email: 'qa.invalid.user.example.com',
    password: 'ValidPass123',
    field: 'emailField',
    expectedError: ERROR_MESSAGES.invalidEmailFormat,
  },
  {
    title: 'email without a domain',
    email: 'qa.invalid.user@',
    password: 'ValidPass123',
    field: 'emailField',
    expectedError: ERROR_MESSAGES.invalidEmailFormat,
  },
  {
    title: 'email with spaces only',
    email: '   ',
    password: 'ValidPass123',
    field: 'emailField',
    expectedError: ERROR_MESSAGES.invalidEmailFormat,
  },
];

/**
 * Well-formed credentials that do not belong to an account, so the backend
 * answers with the generic "incorrect email or password" banner.
 *
 * A function, not a constant, so every run uses a fresh address and cannot hit
 * a real account or an account-lockout counter.
 *
 * @returns {{email: string, password: string, expectedError: string}} Dataset for the negative log-in.
 */
function unregisteredCredentials() {
  return {
    email: generateEmail('qa.unregistered'),
    password: generatePassword(),
    expectedError: ERROR_MESSAGES.invalidCredentials,
  };
}

module.exports = { CLIENT_SIDE_INVALID_CREDENTIALS, unregisteredCredentials };
