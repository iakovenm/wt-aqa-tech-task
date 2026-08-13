const { test: base } = require('@playwright/test');

const UserApiClient = require('../api/user-api-client');
const { generateUserPayload } = require('../data/test-data-generator');

/**
 * Fixtures for the API suite.
 *
 * `userApi` gives each test its own client bound to the project `baseURL`.
 * `createUser` is a factory for arranging users on demand, and `createdUser`
 * is the common "one valid user already exists" case built on top of it.
 *
 * Every spec obtains its data this way instead of relying on ids that happen to
 * be seeded, so the suite runs unchanged against a deployed service.
 */
const test = base.extend({
  /** Client for GET/POST /user. */
  userApi: async ({ request }, use) => {
    await use(new UserApiClient(request));
  },

  /**
   * Creates a user through POST /user and fails the test if the arrangement
   * itself did not work — a broken setup must not read as a failing assertion.
   *
   * @returns {(overrides?: object) => Promise<{payload: object, user: object}>} Factory
   *   taking payload overrides and returning the payload plus the creation response body.
   */
  createUser: async ({ userApi }, use) => {
    await use(async (overrides = {}) => {
      const payload = generateUserPayload(overrides);
      const response = await userApi.createUser(payload);

      if (response.status !== 201) {
        throw new Error(
          `Fixture setup failed: POST /user returned ${response.status} ${JSON.stringify(response.body)}`,
        );
      }

      return { payload, user: response.body };
    });
  },

  /**
   * A user created through POST /user, plus the payload it was created from.
   *
   * @returns {{payload: object, user: object}} Request payload and creation response body.
   */
  createdUser: async ({ createUser }, use) => {
    await use(await createUser());
  },
});

module.exports = { test };
