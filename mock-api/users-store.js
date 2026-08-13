/**
 * In-memory user storage and the business rules of the Users API.
 *
 * Kept separate from the HTTP layer (`server.js`) so the contract rules are
 * readable on their own and can be unit-tested or reused by another transport.
 */

const AGE_MIN = 1;
const AGE_MAX = 100;
const USERNAME_MAX_LENGTH = 64;

/**
 * Users that exist from start-up, so the service can be explored by hand
 * (`npm run mock-api` + curl). The specs deliberately do not read them: they
 * create their own data through POST /user so they stay portable to a real
 * service that has never heard of these ids.
 */
const SEEDED_USERS = [
  { user_id: 'usr_1001', username: 'seeded_personal_user', age: 30, user_type: true },
  { user_id: 'usr_1002', username: 'seeded_business_user', age: 45, user_type: false },
];

class UsersStore {
  constructor() {
    /** @type {Map<string, {user_id: string, username: string, age: number, user_type: boolean}>} */
    this.users = new Map();
    this.nextId = 2001;

    for (const user of SEEDED_USERS) {
      this.users.set(user.user_id, { ...user });
    }
  }

  /**
   * @param {string} userId - Identifier to look up.
   * @returns {object|undefined} The stored user, or undefined when unknown.
   */
  find(userId) {
    return this.users.get(userId);
  }

  /**
   * Persists a new user.
   *
   * @param {{username: string, age: number, user_type: boolean}} payload - Validated payload.
   * @returns {object} The stored user record.
   */
  create({ username, age, user_type: userType }) {
    const user = {
      user_id: `usr_${this.nextId++}`,
      username,
      age,
      user_type: userType,
    };
    this.users.set(user.user_id, user);
    return user;
  }

  /**
   * Validates a POST /user payload against the documented contract.
   *
   * @param {*} payload - Parsed request body.
   * @returns {string[]} Human readable violations; empty when the payload is valid.
   */
  static validateCreatePayload(payload) {
    const errors = [];

    if (payload === null || typeof payload !== 'object' || Array.isArray(payload)) {
      return ['body must be a JSON object'];
    }

    const { username, age, user_type: userType } = payload;

    if (typeof username !== 'string' || username.trim() === '') {
      errors.push('username must be a non-empty string');
    } else if (username.length > USERNAME_MAX_LENGTH) {
      errors.push(`username must be at most ${USERNAME_MAX_LENGTH} characters`);
    }

    if (typeof age !== 'number' || !Number.isInteger(age)) {
      errors.push('age must be an integer');
    } else if (age < AGE_MIN || age > AGE_MAX) {
      errors.push(`age must be between ${AGE_MIN} and ${AGE_MAX}`);
    }

    if (typeof userType !== 'boolean') {
      errors.push('user_type must be a boolean');
    }

    const unexpected = Object.keys(payload).filter(
      (key) => !['username', 'age', 'user_type'].includes(key),
    );
    if (unexpected.length > 0) {
      errors.push(`unexpected properties: ${unexpected.join(', ')}`);
    }

    return errors;
  }
}

module.exports = { UsersStore };
