/**
 * Single source of truth for every environment-dependent value.
 *
 * Everything is overridable through environment variables (see `.env.example`),
 * so the same suite can be pointed at staging/production without code changes.
 *
 * `.env` is loaded here rather than in `playwright.config.js`, so anything that
 * requires this module — the Playwright config, but also `npm run mock-api` —
 * sees the same values. Real environment variables (CI) always win: dotenv
 * never overwrites what is already set.
 */

const path = require('node:path');

const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

/** Deliberately unusual, to reduce the chance of colliding with a local service. */
const DEFAULT_MOCK_API_PORT = 4017;

const mockApiPort = Number(process.env.MOCK_API_PORT || DEFAULT_MOCK_API_PORT);

const urls = {
  /** Public marketing site (paydo.com). */
  marketing: trimSlash(process.env.MARKETING_BASE_URL || 'https://paydo.com'),
  /** Customer area where sign-up / log-in live (account.paydo.com). */
  account: trimSlash(process.env.ACCOUNT_BASE_URL || 'https://account.paydo.com'),
  /**
   * Users API under test. When `API_BASE_URL` is not provided the suite starts
   * the bundled mock service from `mock-api/` instead (see playwright.config.js).
   */
  api: trimSlash(process.env.API_BASE_URL || `http://127.0.0.1:${mockApiPort}`),
};

const paths = {
  home: '/',
  signUp: '/en/auth/personal/sign-up',
  signIn: '/en/auth/personal/sign-in',
  businessSignUp: '/en/auth/business/sign-up',
};

/** Whether the suite owns the API lifecycle (mock) or talks to a deployed one. */
const usesMockApi = !process.env.API_BASE_URL;

/**
 * Per-layer budgets, in milliseconds. Browser tests wait on a live site; API
 * tests answer in tens of milliseconds, so they get a much tighter budget and a
 * hung request fails fast instead of stalling the run.
 */
const timeouts = {
  uiTest: Number(process.env.TEST_TIMEOUT || 90_000),
  uiExpect: Number(process.env.EXPECT_TIMEOUT || 10_000),
  apiTest: Number(process.env.API_TEST_TIMEOUT || 15_000),
  apiExpect: Number(process.env.API_EXPECT_TIMEOUT || 5_000),
};

/**
 * Whether PayDo offers personal accounts where this run originates from.
 *
 * PayDo disables personal sign-up in some countries, which changes the expected
 * state of the form. Set `PERSONAL_ACCOUNTS_AVAILABLE=true|false` to make that
 * an asserted expectation; leave it unset and the spec detects the region
 * notice at run time and skips the scenario that cannot apply.
 *
 * @type {boolean|null} null when unset — detect at run time.
 */
const personalAccountsAvailable = readOptionalBoolean(process.env.PERSONAL_ACCOUNTS_AVAILABLE);

/**
 * Removes a trailing slash so `url + path` never produces a double slash.
 *
 * @param {string} value - Raw URL.
 * @returns {string} URL without a trailing slash.
 */
function trimSlash(value) {
  return value.replace(/\/+$/, '');
}

/**
 * Reads a tri-state flag: true, false, or "not configured".
 *
 * @param {string|undefined} value - Raw environment value.
 * @returns {boolean|null} Parsed boolean, or null when unset/blank.
 * @throws {Error} When set to something that is neither 'true' nor 'false'.
 */
function readOptionalBoolean(value) {
  if (value === undefined || value.trim() === '') return null;
  if (value === 'true') return true;
  if (value === 'false') return false;
  throw new Error(`Expected 'true', 'false' or an empty value, got '${value}'`);
}

module.exports = {
  urls,
  paths,
  mockApiPort,
  usesMockApi,
  timeouts,
  personalAccountsAvailable,
};
