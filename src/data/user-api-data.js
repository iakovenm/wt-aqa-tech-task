/**
 * Datasets for the Users API specs.
 *
 * Boundary and negative cases live here so the specs stay small and a new case
 * is one array entry.
 */

const { AGE_MIN, AGE_MAX } = require('../api/schemas/user.schemas');
const { generateUsername } = require('./test-data-generator');

/** Content type every JSON endpoint must answer with. */
const JSON_CONTENT_TYPE = /application\/json/;

/**
 * Ages that must be accepted — the edges of the documented 1-100 range.
 *
 * @type {Array<{title: string, age: number}>}
 */
const VALID_AGE_BOUNDARIES = [
  { title: `lower boundary (${AGE_MIN})`, age: AGE_MIN },
  { title: 'mid range (50)', age: 50 },
  { title: `upper boundary (${AGE_MAX})`, age: AGE_MAX },
];

/**
 * Payloads POST /user must reject with 400.
 *
 * @returns {Array<{title: string, payload: object}>} Invalid payload datasets.
 */
function invalidCreateUserPayloads() {
  const base = { username: generateUsername(), age: 30, user_type: true };

  return [
    { title: 'age below the allowed range', payload: { ...base, age: AGE_MIN - 1 } },
    { title: 'age above the allowed range', payload: { ...base, age: AGE_MAX + 1 } },
    { title: 'age as a non-integer number', payload: { ...base, age: 30.5 } },
    { title: 'age as a numeric string', payload: { ...base, age: '30' } },
    { title: 'username as a number', payload: { ...base, username: 12345 } },
    { title: 'username empty', payload: { ...base, username: '' } },
    { title: 'user_type as a string', payload: { ...base, user_type: 'true' } },
    { title: 'username missing', payload: { age: 30, user_type: true } },
    { title: 'age missing', payload: { username: base.username, user_type: true } },
    { title: 'user_type missing', payload: { username: base.username, age: 30 } },
  ];
}

/** Both `user_type` values, so neither branch of the flag goes untested. */
const USER_TYPES = [
  { title: 'personal user (user_type: true)', userType: true },
  { title: 'business user (user_type: false)', userType: false },
];

module.exports = {
  JSON_CONTENT_TYPE,
  VALID_AGE_BOUNDARIES,
  invalidCreateUserPayloads,
  USER_TYPES,
};
