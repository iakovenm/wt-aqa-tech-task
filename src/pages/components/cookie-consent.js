/**
 * Cookie consent banner (Termly), shown on both paydo.com and account.paydo.com.
 *
 * It is injected asynchronously and draws a full-page overlay that swallows
 * clicks, so dismissing it once on `open()` is not always enough: on a slow load
 * it can appear after the page is otherwise interactive. Pages therefore call
 * {@link CookieConsent#ensureDismissed} again right before submitting a form.
 */

/** How long to wait for the banner and for its overlay to disappear, in ms. */
const BANNER_TIMEOUT = 7000;

/** Short probe used when the overlay may still be on its way in. */
const OVERLAY_PROBE_TIMEOUT = 2000;

class CookieConsent {
  /**
   * @param {import('@playwright/test').Page} page - Page this component lives on.
   */
  constructor(page) {
    this.page = page;
  }

  /** Locators */

  get dialog() {
    return this.page.getByRole('alertdialog', { name: 'Cookie Consent Prompt' });
  }

  get acceptButton() {
    return this.page.locator('[data-tid="banner-accept"]');
  }

  /** The click-blocking layer drawn behind the banner; it can outlive the dialog. */
  get overlay() {
    return this.page.locator('#termly-overlay');
  }

  /** Methods */

  /**
   * Accepts the banner when it appears, and does nothing when it does not
   * (already-consented sessions, or A/B variants without the banner).
   *
   * @param {number} [timeout=BANNER_TIMEOUT] - How long to wait for the banner, in ms.
   * @returns {Promise<boolean>} True when the banner was accepted.
   */
  async acceptIfPresent(timeout = BANNER_TIMEOUT) {
    try {
      await this.acceptButton.waitFor({ state: 'visible', timeout });
    } catch {
      return false;
    }

    await this.accept(timeout);
    return true;
  }

  /**
   * Accepts a banner that is already on screen and waits until nothing of it is
   * left covering the page.
   *
   * @param {number} [timeout=BANNER_TIMEOUT] - Budget for each wait, in ms.
   */
  async accept(timeout = BANNER_TIMEOUT) {
    await this.acceptButton.click();
    await this.dialog.waitFor({ state: 'hidden', timeout });
    await this.overlay.waitFor({ state: 'hidden', timeout });
  }

  /**
   * Guarantees the banner cannot intercept the next click.
   *
   * Cheap when there is nothing to dismiss — waiting for a hidden state resolves
   * at once for an element that is not in the DOM. Retries once, because the
   * banner can appear while the first check is running.
   *
   * @param {number} [timeout=BANNER_TIMEOUT] - Budget for the final wait, in ms.
   * @throws {Error} When the overlay is still covering the page afterwards.
   */
  async ensureDismissed(timeout = BANNER_TIMEOUT) {
    for (const attempt of [1, 2]) {
      if (await this.acceptButton.isVisible()) {
        await this.accept(timeout);
      }

      try {
        await this.overlay.waitFor({
          state: 'hidden',
          timeout: attempt === 1 ? OVERLAY_PROBE_TIMEOUT : timeout,
        });
        return;
      } catch {
        // The banner may have been injected while we were waiting: look again.
      }
    }

    throw new Error(
      'The cookie consent overlay is still covering the page and would intercept the next click',
    );
  }
}

module.exports = CookieConsent;
