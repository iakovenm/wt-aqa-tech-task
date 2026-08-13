const { expect } = require('@playwright/test');

const BasePage = require('./base-page');
const { urls, paths } = require('../config/environment');

/**
 * PayDo marketing home page — https://paydo.com/
 *
 * Entry point for both UI scenarios: it owns the "Open account" CTA and the
 * header "Log In" link.
 */
class HomePage extends BasePage {
  /**
   * @param {import('@playwright/test').Page} page - Playwright page object.
   */
  constructor(page) {
    super(page, urls.marketing, paths.home);
  }

  /** Locators */

  get header() {
    return this.page.getByRole('banner');
  }

  get heroHeading() {
    return this.page.getByRole('heading', { level: 1 });
  }

  /**
   * The hero "Open account" CTA. The same label is repeated in later sections,
   * so the first match — the above-the-fold one — is the button under test.
   */
  get openAccountButton() {
    return this.page.getByRole('link', { name: 'Open account' }).first();
  }

  /** Header CTA, which is labelled "Get account" but targets the same sign-up page. */
  get getAccountButton() {
    return this.header.getByRole('link', { name: 'Get account' }).first();
  }

  get logInLink() {
    return this.header.getByRole('link', { name: 'Log In' }).first();
  }

  get viewPricingButton() {
    return this.page.getByRole('link', { name: 'View pricing' }).first();
  }

  /** Methods */

  /**
   * Asserts the home page rendered.
   */
  async expectLoaded() {
    await expect(this.header).toBeVisible();
    await expect(this.heroHeading).toBeVisible();
    await expect(this.openAccountButton).toBeVisible();
  }

  /**
   * Clicks the hero "Open account" CTA and waits for the sign-up page to load.
   *
   * The CTA navigates cross-origin to the customer area, so this waits for the
   * URL rather than assuming the click resolves synchronously.
   */
  async clickOpenAccount() {
    await this.openAccountButton.click();
    await this.page.waitForURL(new RegExp(`${paths.signUp}(\\?.*)?$`), { waitUntil: 'domcontentloaded' });
  }

  /**
   * Clicks the header "Log In" link and waits for the sign-in page to load.
   */
  async clickLogIn() {
    await this.logInLink.click();
    await this.page.waitForURL(new RegExp(`${paths.signIn}(\\?.*)?$`), { waitUntil: 'domcontentloaded' });
  }
}

module.exports = HomePage;
