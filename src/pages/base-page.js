const CookieConsent = require('./components/cookie-consent');

/**
 * Shared behaviour for every page object: navigation, cookie handling and the
 * `expectLoaded()` contract each page implements.
 *
 * Adding a page means extending this class, declaring locators as getters and
 * implementing `expectLoaded()`.
 */
class BasePage {
  /**
   * @param {import('@playwright/test').Page} page - Playwright page tied to this page object.
   * @param {string} baseUrl - Origin this page belongs to (marketing site or customer area).
   * @param {string} [path=''] - Path of this page within `baseUrl`.
   */
  constructor(page, baseUrl, path = '') {
    this.page = page;
    this.baseUrl = baseUrl;
    this.path = path;
    this.cookieConsent = new CookieConsent(page);
  }

  /** @returns {string} Absolute URL of this page. */
  get url() {
    return `${this.baseUrl}${this.path}`;
  }

  /**
   * Navigates to this page and dismisses the cookie banner.
   *
   * @returns {Promise<this>} This page object, for chaining.
   */
  async open() {
    await this.page.goto(this.url, { waitUntil: 'domcontentloaded' });
    await this.cookieConsent.acceptIfPresent();
    return this;
  }

  /**
   * Asserts the page rendered its defining elements. Every subclass overrides it.
   *
   * @abstract
   * @throws {Error} When a subclass has not implemented it.
   */
  async expectLoaded() {
    throw new Error(`${this.constructor.name} must implement expectLoaded()`);
  }
}

module.exports = BasePage;
