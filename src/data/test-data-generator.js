/**
 * Generators for unique, per-run test data.
 *
 * Unique values keep parallel workers and repeated runs from colliding on
 * already-used emails or usernames.
 */

const { AGE_MIN, AGE_MAX } = require('../api/schemas/user.schemas');

/**
 * Builds a value that is unique for this run.
 *
 * @param {string} prefix - Human readable prefix.
 * @returns {string} `<prefix>-<timestamp>-<random>`.
 */
function uniqueSuffix(prefix) {
  const random = Math.random().toString(36).slice(2, 8);
  return `${prefix}-${Date.now()}-${random}`;
}

/**
 * @param {string} [prefix='qa.user'] - Local-part prefix.
 * @param {string} [domain='example.com'] - Mail domain.
 * @returns {string} A syntactically valid, unique email address.
 */
function generateEmail(prefix = 'qa.user', domain = 'example.com') {
  return `${uniqueSuffix(prefix)}@${domain}`;
}

/**
 * @param {string} [prefix='qa_user'] - Username prefix.
 * @returns {string} A unique username.
 */
function generateUsername(prefix = 'qa_user') {
  return uniqueSuffix(prefix).replace(/[.-]/g, '_');
}

/**
 * Generates a password that satisfies the PayDo policy: 8+ characters with a
 * lowercase letter, an uppercase letter and a digit.
 *
 * @returns {string} A policy-compliant password.
 */
function generatePassword() {
  return `Qa${Math.random().toString(36).slice(2, 8)}${Date.now() % 100000}!`;
}

/**
 * @param {number} [min=AGE_MIN] - Inclusive lower bound.
 * @param {number} [max=AGE_MAX] - Inclusive upper bound.
 * @returns {number} A random integer age inside the contract range.
 */
function generateAge(min = AGE_MIN, max = AGE_MAX) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Builds a valid POST /user payload.
 *
 * @param {{username?: string, age?: number, user_type?: boolean}} [overrides={}] - Fields to override.
 * @returns {{username: string, age: number, user_type: boolean}} Request payload.
 */
function generateUserPayload(overrides = {}) {
  return {
    username: generateUsername(),
    age: generateAge(),
    user_type: true,
    ...overrides,
  };
}

module.exports = {
  generateEmail,
  generateUsername,
  generatePassword,
  generateUserPayload,
};
