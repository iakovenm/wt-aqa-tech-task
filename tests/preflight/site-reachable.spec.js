const { test, expect } = require('../../src/fixtures');
const { urls } = require('../../src/config/environment');

/**
 * Precondition for the whole UI suite: PayDo has to serve the network the run
 * originates from.
 *
 * It refuses datacenter IP ranges — GitHub-hosted runners included — by
 * redirecting every request to `blocked.paydo.com`. Without this check that
 * surfaces as a dozen unrelated locator timeouts across three retries, and
 * nothing in the report says why. The `ui-chromium` project depends on this
 * project, so a block fails once, in seconds, with the reason spelled out, and
 * the browser tests are reported as skipped rather than broken.
 */
test.describe('Preflight', { tag: ['@ui', '@preflight'] }, () => {
  test('PayDo serves this network', async ({ page }) => {
    const response = await page.goto(urls.marketing, { waitUntil: 'domcontentloaded' });

    expect(response, `No response at all from ${urls.marketing}`).not.toBeNull();

    const landedOn = page.url();
    const { hostname } = new URL(landedOn);

    expect(
      hostname,
      `${urls.marketing} redirected to ${landedOn}. PayDo blocks this network — typically a `
      + 'datacenter IP such as a GitHub-hosted runner. Run the UI suite from a network it serves, '
      + 'or point MARKETING_BASE_URL / ACCOUNT_BASE_URL at an environment that is reachable.',
    ).not.toMatch(/^blocked\./);

    expect(
      response.status(),
      `${landedOn} answered with HTTP ${response.status()}`,
    ).toBeLessThan(400);
  });
});
