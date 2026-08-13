const { test, expect } = require('../../src/fixtures');
const { ERROR_MESSAGES } = require('../../src/data/expected-content');
const {
  CLIENT_SIDE_INVALID_CREDENTIALS,
  unregisteredCredentials,
} = require('../../src/data/login-data');

/**
 * Task 2 — open the log-in page, submit invalid data and verify the error message.
 *
 * Split into the two layers that reject invalid input: client-side field
 * validation, and the backend response to well-formed but wrong credentials.
 */
test.describe('Log in with invalid credentials', { tag: '@ui' }, () => {
  test('Log in page is reachable from the home page header', async ({ openedHomePage, loginPage }) => {
    await openedHomePage.clickLogIn();
    await loginPage.cookieConsent.acceptIfPresent();

    await loginPage.expectLoaded();
    await expect(loginPage.forgotPasswordLink).toBeVisible();
    await expect(loginPage.switchToBusinessAccountButton).toBeVisible();
  });

  test(
    'Wrong email and password are rejected with an error message',
    async ({ openedLoginPage }) => {
      const credentials = unregisteredCredentials();

      await test.step('Submit credentials that do not belong to an account', async () => {
        await openedLoginPage.login(credentials);
      });

      await test.step('The error message is shown and the user stays on the log-in page', async () => {
        await expect(openedLoginPage.formError).toBeVisible();
        await expect(openedLoginPage.formError).toHaveText(credentials.expectedError);
        await openedLoginPage.expectLoaded();
      });
    },
  );

  for (const dataset of CLIENT_SIDE_INVALID_CREDENTIALS) {
    test(`Log in is blocked for an ${dataset.title}`, async ({ openedLoginPage }) => {
      const field = openedLoginPage[dataset.field];

      await openedLoginPage.fillCredentials(dataset);

      await expect(field.error).toBeVisible();
      await expect(field.error).toHaveText(dataset.expectedError);
      // Client-side validation must stop the request from being sent at all.
      await expect(openedLoginPage.logInButton).toBeDisabled();
    });
  }

  test('Empty credentials show the required-field errors', async ({ openedLoginPage }) => {
    await openedLoginPage.emailField.clear();
    await openedLoginPage.passwordField.clear();

    await expect(openedLoginPage.emailField.error).toHaveText(ERROR_MESSAGES.requiredField);
    await expect(openedLoginPage.passwordField.error).toHaveText(ERROR_MESSAGES.requiredField);
    await expect(openedLoginPage.logInButton).toBeDisabled();
  });
});
