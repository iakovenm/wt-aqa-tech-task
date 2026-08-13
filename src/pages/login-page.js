const { expect } = require('@playwright/test');

const BasePage = require('./base-page');
const FormField = require('./components/form-field');
const { urls, paths } = require('../config/environment');

/**
 * "Welcome back" log-in page — https://account.paydo.com/en/auth/personal/sign-in
 */
class LoginPage extends BasePage {
  /**
   * @param {import('@playwright/test').Page} page - Playwright page object.
   */
  constructor(page) {
    super(page, urls.account, paths.signIn);

    this.emailField = new FormField(page, 'email');
    this.passwordField = new FormField(page, 'password');
  }

  /** Locators */

  get heading() {
    return this.page.getByRole('heading', { name: 'Welcome back', level: 1 });
  }

  get logInButton() {
    return this.page.getByRole('button', { name: 'Log in' });
  }

  get forgotPasswordLink() {
    return this.page.getByRole('link', { name: 'Forgot your password?' });
  }

  get signUpButton() {
    return this.page.getByRole('link', { name: 'Sign Up' });
  }

  get switchToBusinessAccountButton() {
    return this.page.getByRole('link', { name: 'Switch to your Business account' });
  }

  /**
   * Form-level error banner returned by the backend, e.g. after submitting
   * credentials that do not belong to an account.
   */
  get formError() {
    return this.page.locator('ngp-info-block.mat-error');
  }

  /** Methods */

  /**
   * Asserts the log-in page rendered.
   */
  async expectLoaded() {
    await expect(this.page).toHaveURL(new RegExp(`${paths.signIn}(\\?.*)?$`));
    await expect(this.heading).toBeVisible();
    await expect(this.emailField.input).toBeVisible();
    await expect(this.passwordField.input).toBeVisible();
    await expect(this.logInButton).toBeVisible();
  }

  /**
   * Fills the credentials without submitting, so field-level validation can be
   * asserted on its own.
   *
   * @param {{email: string, password: string}} credentials - Credentials to enter.
   */
  async fillCredentials({ email, password }) {
    await this.emailField.fill(email);
    await this.passwordField.fill(password);
  }

  /**
   * Fills the credentials and submits the form.
   *
   * @param {{email: string, password: string}} credentials - Credentials to submit.
   * @throws {Error} When the form stays invalid and the submit button is never enabled.
   */
  async login({ email, password }) {
    await this.fillCredentials({ email, password });

    // The button unlocks only once client-side validation passes.
    await expect(
      this.logInButton,
      'Log in button stayed disabled — the form was rejected client-side',
    ).toBeEnabled();

    // The consent banner is injected asynchronously and would swallow the click.
    await this.cookieConsent.ensureDismissed();

    await this.logInButton.click();
  }
}

module.exports = LoginPage;
