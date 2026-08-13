/**
 * A single field of a PayDo auth form.
 *
 * The customer area is built on an Angular component library that exposes stable
 * `datatestname` / `datatestrole` attributes. Wrapping one field in a component
 * keeps every page object free of that markup detail and gives each field the
 * same input/label/error API.
 *
 * @example
 * const email = new FormField(page, 'email');
 * await email.fill('user@example.com');
 * await expect(email.error).toHaveText('Please enter correct email');
 */
class FormField {
  /**
   * @param {import('@playwright/test').Page} page - Page the field lives on.
   * @param {string} name - Value of the field's `datatestname` attribute
   *   (e.g. 'email', 'password', 'passwordConfirm').
   */
  constructor(page, name) {
    this.page = page;
    this.name = name;
  }

  /** Locators */

  /** The whole field wrapper: label, control, hint and error. */
  get root() {
    return this.page.locator(`[datatestname="${this.name}"]`);
  }

  get input() {
    return this.root.locator('[datatestrole="input"]');
  }

  get label() {
    return this.root.locator('[datatestrole="label"]');
  }

  /** Inline validation message, rendered only while the field is invalid. */
  get error() {
    return this.root.locator('[datatestrole="error"]');
  }

  /** Methods */

  /**
   * Types a value into the field and blurs it so validation runs.
   *
   * @param {string} value - Value to type.
   */
  async fill(value) {
    await this.input.fill(value);
    await this.input.blur();
  }

  /**
   * Empties the field and blurs it, so the "required" validation is triggered.
   *
   * Types a throwaway character first: the form only validates fields the user
   * has actually touched, and clearing an already-empty field is a no-op for it.
   */
  async clear() {
    await this.input.fill('x');
    await this.input.fill('');
    await this.input.blur();
  }
}

module.exports = FormField;
