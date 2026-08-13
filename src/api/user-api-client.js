const BaseApiClient = require('./base-api-client');

/**
 * Client for the Users API endpoints under test.
 *
 * One method per endpoint, so specs stay declarative and a contract change is a
 * one-line edit here rather than a sweep across test files.
 */
class UserApiClient extends BaseApiClient {
  /**
   * GET /user — fetches a user by id.
   *
   * @param {string} [userId] - Identifier passed as the `user_id` query parameter.
   *   Omit it to send the request without the parameter (negative case); pass an
   *   empty string to send it blank.
   * @returns {Promise<object>} Normalised response from {@link BaseApiClient#send}.
   */
  async getUser(userId) {
    const params = userId === undefined ? undefined : { user_id: userId };
    return this.send('get', '/user', { params });
  }

  /**
   * POST /user — creates a user.
   *
   * @param {{username?: string, age?: number, user_type?: boolean}} payload - Request body,
   *   passed through untouched so invalid payloads can be tested too.
   * @returns {Promise<object>} Normalised response.
   */
  async createUser(payload) {
    return this.send('post', '/user', {
      data: payload,
      headers: { 'content-type': 'application/json' },
    });
  }
}

module.exports = UserApiClient;
