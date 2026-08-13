const { test, expect } = require('../../src/fixtures');
const { personalAccountsAvailable } = require('../../src/config/environment');

/**
 * Task 1 — open https://paydo.com/, click "Open account" and verify that every
 * UI element of the resulting screen is present.
 */
test.describe('Open account', { tag: '@ui' }, () => {
  test('Home page shows the Open account entry points', async ({ openedHomePage }) => {
    await openedHomePage.expectLoaded();

    await expect(openedHomePage.getAccountButton).toBeVisible();
    await expect(openedHomePage.logInLink).toBeVisible();
    await expect(openedHomePage.viewPricingButton).toBeVisible();
  });

  test(
    'Open account opens the personal sign-up page with all UI elements',
    async ({ openedHomePage, signUpPage }) => {
      await test.step('Click "Open account" on the home page', async () => {
        await openedHomePage.clickOpenAccount();
        await signUpPage.cookieConsent.acceptIfPresent();
      });

      await test.step('All sign-up UI elements are present', async () => {
        await signUpPage.expectLoaded();
      });

      await test.step('Password policy hints are listed under the password field', async () => {
        await signUpPage.expectPasswordRequirements();
      });

      await test.step('Supporting links point at the expected destinations', async () => {
        await expect(signUpPage.logInButton).toHaveAttribute('href', /\/auth\/personal\/sign-in/);
        await expect(signUpPage.switchToBusinessAccountButton).toHaveAttribute(
          'href',
          /\/auth\/business\/sign-up/,
        );
        await expect(signUpPage.termsOfUseLink).toHaveAttribute('href', /terms-of-use/);
        await expect(signUpPage.benefitsPanel).toBeVisible();
      });
    },
  );

  /*
   * PayDo does not offer personal accounts in every country: where it does not,
   * the form renders but stays disabled behind a notice. Both states are correct
   * product behaviour, so which one to expect is a configuration decision rather
   * than something a test should discover and quietly work around.
   *
   * `PERSONAL_ACCOUNTS_AVAILABLE=true`  -> only the editable-form test runs, and it
   *                                        fails if the restriction notice appears.
   * `PERSONAL_ACCOUNTS_AVAILABLE=false` -> only the restricted-form test runs.
   * unset                               -> the editable-form test runs and skips
   *                                        itself if the notice is present.
   */

  test('Sign-up form is editable where personal accounts are offered', async ({ signUpPage }) => {
    test.skip(
      personalAccountsAvailable === false,
      'PERSONAL_ACCOUNTS_AVAILABLE=false — the restricted-form test covers this configuration',
    );

    await signUpPage.open();
    await signUpPage.expectLoaded();

    // Unconfigured runs cannot know their region, so detect it; a configured
    // `true` asserts the editable state instead and fails on the notice.
    test.skip(
      personalAccountsAvailable === null && await signUpPage.isRegionRestricted(),
      'Personal accounts are not offered in the region this run originates from. '
      + 'Set PERSONAL_ACCOUNTS_AVAILABLE=true|false to assert a state instead of skipping.',
    );

    await expect(signUpPage.regionRestrictionNotice).toBeHidden();
    await signUpPage.expectFormEditable();
  });

  test('Sign-up form is disabled behind a notice where they are not', async ({ signUpPage }) => {
    test.skip(
      personalAccountsAvailable !== false,
      'Asserted only when PERSONAL_ACCOUNTS_AVAILABLE=false',
    );

    await signUpPage.open();
    await signUpPage.expectLoaded();
    await signUpPage.expectFormRestricted();
  });
});
