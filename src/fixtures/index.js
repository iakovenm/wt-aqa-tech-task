const { mergeTests } = require('@playwright/test');

const { test: apiTest } = require('./api-fixtures');
const { test: uiTest } = require('./ui-fixtures');
const { expect } = require('../utils/expect-extensions');

/**
 * The single entry point every spec imports:
 *
 * ```js
 * const { test, expect } = require('../../src/fixtures');
 * ```
 *
 * UI and API fixtures are merged into one `test` object, so a spec can mix both
 * (for example, seeding data over the API before driving the UI), and `expect`
 * already carries the project's custom matchers.
 */
const test = mergeTests(uiTest, apiTest);

module.exports = { test, expect };
