const { test: base } = require('@playwright/test');

const HomePage = require('../pages/home-page');
const LoginPage = require('../pages/login-page');
const SignUpPage = require('../pages/sign-up-page');

/**
 * Page-object fixtures for the UI suite.
 *
 * Specs declare the pages they need in their arguments and receive ready
 * instances, so no test constructs page objects by hand. Adding a page means
 * adding one fixture here.
 *
 * Plain fixtures (`homePage`, `loginPage`, `signUpPage`) hand over an instance
 * without navigating; the `*Opened` variants also navigate and dismiss cookies.
 */
const test = base.extend({
  homePage: async ({ page }, use) => {
    await use(new HomePage(page));
  },

  signUpPage: async ({ page }, use) => {
    await use(new SignUpPage(page));
  },

  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },

  /** Home page, loaded and past the cookie banner. */
  openedHomePage: async ({ homePage }, use) => {
    await homePage.open();
    await use(homePage);
  },

  /** Log-in page reached directly by URL, ready for input. */
  openedLoginPage: async ({ loginPage }, use) => {
    await loginPage.open();
    await loginPage.expectLoaded();
    await use(loginPage);
  },
});

module.exports = { test };
