const { test, expect } = require('../../src/fixtures');
const {
  getUserResponseSchema,
  errorResponseSchema,
  AGE_MIN,
  AGE_MAX,
} = require('../../src/api/schemas/user.schemas');
const { JSON_CONTENT_TYPE } = require('../../src/data/user-api-data');

/**
 * Task 3.1 — GET /user returns, for a given `user_id`:
 * username (string), age (integer within 1-100) and user_id.
 *
 * Every test arranges its own user through POST /user rather than reading an id
 * that only the bundled mock knows, so the suite runs unchanged against a
 * deployed service (`API_BASE_URL=...`).
 */
test.describe('GET /user', { tag: '@api' }, () => {
  test('Returns user_id, username and age for an existing user', async ({ userApi, createdUser }) => {
    const response = await userApi.getUser(createdUser.user.user_id);

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toMatch(JSON_CONTENT_TYPE);
    expect(response.body).toMatchSchema(getUserResponseSchema);
    expect(response.body).toEqual({
      user_id: createdUser.user.user_id,
      username: createdUser.payload.username,
      age: createdUser.payload.age,
    });
  });

  test('Field types and the age range match the contract', async ({ userApi, createUser }) => {
    const { user } = await createUser({ user_type: false });

    const response = await userApi.getUser(user.user_id);

    expect(response.status).toBe(200);

    const { user_id: userId, username, age } = response.body;

    expect(typeof userId, 'user_id must be a string').toBe('string');
    expect(typeof username, 'username must be a string').toBe('string');
    expect(username.length, 'username must not be empty').toBeGreaterThan(0);

    expect(Number.isInteger(age), `age must be an integer, got ${age}`).toBe(true);
    expect(age).toBeGreaterThanOrEqual(AGE_MIN);
    expect(age).toBeLessThanOrEqual(AGE_MAX);
  });

  test('Does not expose fields outside the contract', async ({ userApi, createdUser }) => {
    const response = await userApi.getUser(createdUser.user.user_id);

    expect(response.status).toBe(200);
    // `user_type` is part of the request, not of the read model.
    expect(Object.keys(response.body).sort()).toEqual(['age', 'user_id', 'username']);
  });

  test('Returns 404 for an unknown user_id', async ({ userApi }) => {
    const response = await userApi.getUser('usr_does_not_exist');

    expect(response.status).toBe(404);
    expect(response.body).toMatchSchema(errorResponseSchema);
  });

  test('Returns 400 when user_id is missing', async ({ userApi }) => {
    const response = await userApi.getUser();

    expect(response.status).toBe(400);
    expect(response.body).toMatchSchema(errorResponseSchema);
  });

  test('Returns 400 when user_id is blank', async ({ userApi }) => {
    const response = await userApi.getUser('');

    expect(response.status).toBe(400);
    expect(response.body).toMatchSchema(errorResponseSchema);
  });
});
