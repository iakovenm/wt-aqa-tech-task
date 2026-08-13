const { expect } = require('@playwright/test');

const BasePage = require('./base-page');
const FormField = require('./components/form-field');
const { urls, paths } = require('../config/environment');
const { PASSWORD_REQUIREMENTS } = require('../data/expected-content');

/**
 * "Create a personal account" page — the destination of the home page
 * "Open account" CTA (https://account.paydo.com/en/auth/personal/sign-up).
 */
class SignUpPage extends BasePage {
  /**
   * @param {import('@playwright/test').Page} page - Playwright page object.
   */
  constructor(page) {
    super(page, urls.account, paths.signUp);

    this.emailField = new FormField(page, 'email');
    this.passwordField = new FormField(page, 'password');
    this.confirmPasswordField = new FormField(page, 'passwordConfirm');
  }

  /** Locators */

  get heading() {
    return this.page.getByRole('heading', { name: 'Create a personal account', level: 1 });
  }

  get createAccountButton() {
    return this.page.getByRole('button', { name: 'Create an account' });
  }

  get logInButton() {
    return this.page.getByRole('link', { name: 'Log In' });
  }

  get backToHomepageButton() {
    return this.page.getByRole('link', { name: 'Back to Homepage' });
  }

  get switchToBusinessAccountButton() {
    return this.page.getByRole('link', { name: 'Switch to create Business account' });
  }

  get termsOfUseLink() {
    return this.page.getByRole('link', { name: /Terms of Use/ });
  }

  /** Password policy hints rendered under the password field. */
  get passwordRequirements() {
    return this.page.locator('.ngp-field-requirements-item__label');
  }

  /**
   * Region-restriction notice. Personal accounts are unavailable in some
   * countries; when shown, the form renders but stays disabled.
   */
  get regionRestrictionNotice() {
    return this.page.getByText(/Personal accounts are currently not offered in your region/);
  }

  /** Marketing panel shown next to the form. */
  get benefitsPanel() {
    return this.page.getByText('Individual IBANs').first();
  }

  /** The three credential fields, in render order. */
  get fields() {
    return [this.emailField, this.passwordField, this.confirmPasswordField];
  }

  /** Methods */

  /**
   * Asserts every element of the sign-up screen is rendered.
   *
   * Deliberately checks visibility rather than enabled state: in restricted
   * regions the same elements render disabled, and their presence is what this
   * scenario verifies.
   */
  async expectLoaded() {
    await expect(this.page).toHaveURL(new RegExp(`${paths.signUp}(\\?.*)?$`));
    await expect(this.heading).toBeVisible();

    for (const field of this.fields) {
      await expect(field.label).toBeVisible();
      await expect(field.input).toBeVisible();
    }

    await expect(this.createAccountButton).toBeVisible();
    await expect(this.logInButton).toBeVisible();
    await expect(this.backToHomepageButton).toBeVisible();
    await expect(this.switchToBusinessAccountButton).toBeVisible();
    await expect(this.termsOfUseLink).toBeVisible();
  }

  /**
   * Asserts the password policy hints match the documented requirements.
   */
  async expectPasswordRequirements() {
    await expect(this.passwordRequirements).toHaveText(PASSWORD_REQUIREMENTS);
  }

  /**
   * @returns {Promise<boolean>} True when the region-restriction notice is shown.
   */
  async isRegionRestricted() {
    return this.regionRestrictionNotice.isVisible();
  }

  /**
   * Asserts the form accepts input — the expected state wherever personal
   * accounts are offered. Nothing has been typed yet, so submitting must still
   * be impossible.
   */
  async expectFormEditable() {
    for (const field of this.fields) {
      await expect(field.input).toBeEditable();
    }
    await expect(this.createAccountButton).toBeDisabled();
  }

  /**
   * Asserts the region-restricted state: the notice explains why, and the form
   * is rendered but cannot be submitted.
   */
  async expectFormRestricted() {
    await expect(this.regionRestrictionNotice).toBeVisible();
    await expect(this.createAccountButton).toBeDisabled();
  }

  /**
   * Fills the whole sign-up form.
   *
   * @param {{email: string, password: string, confirmPassword?: string}} credentials - Values to enter;
   *   `confirmPassword` defaults to `password`.
   */
  async fillForm({ email, password, confirmPassword = password }) {
    await this.emailField.fill(email);
    await this.passwordField.fill(password);
    await this.confirmPasswordField.fill(confirmPassword);
  }
}

module.exports = SignUpPage;
