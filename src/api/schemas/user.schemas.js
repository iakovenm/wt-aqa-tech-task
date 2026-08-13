/**
 * Response contracts for the Users API.
 *
 * These are the single place where the API shape is declared — tests assert
 * against them instead of repeating field-by-field type checks.
 */

const AGE_MIN = 1;
const AGE_MAX = 100;

/** GET /user -> username(str), age(int)[1-100], user_id. */
const getUserResponseSchema = {
  type: 'object',
  required: ['user_id', 'username', 'age'],
  additionalProperties: false,
  properties: {
    user_id: { type: 'string', minLength: 1 },
    username: { type: 'string', minLength: 1 },
    age: { type: 'integer', minimum: AGE_MIN, maximum: AGE_MAX },
  },
};

/** POST /user -> user_id, username. */
const createUserResponseSchema = {
  type: 'object',
  required: ['user_id', 'username'],
  additionalProperties: false,
  properties: {
    user_id: { type: 'string', minLength: 1 },
    username: { type: 'string', minLength: 1 },
  },
};

/** Error envelope returned for 4xx responses. */
const errorResponseSchema = {
  type: 'object',
  required: ['error'],
  properties: {
    error: { type: 'string', minLength: 1 },
    details: { type: 'array', items: { type: 'string' } },
  },
};

module.exports = {
  getUserResponseSchema,
  createUserResponseSchema,
  errorResponseSchema,
  AGE_MIN,
  AGE_MAX,
};
