const { expect: baseExpect } = require('@playwright/test');

const { validateSchema } = require('./schema-validator');

/**
 * Project-wide custom matchers.
 *
 * `toMatchSchema` turns a contract check into one assertion that reports every
 * violation at once, instead of a chain of per-field type assertions.
 *
 * @example
 * expect(response.body).toMatchSchema(getUserResponseSchema);
 */
const expect = baseExpect.extend({
  /**
   * Asserts a value satisfies a schema (see `utils/schema-validator.js`).
   *
   * @param {*} received - Value to validate, typically a parsed response body.
   * @param {object} schema - Schema to validate against.
   * @returns {{pass: boolean, message: () => string, name: string}} Matcher result.
   */
  toMatchSchema(received, schema) {
    const { valid, errors } = validateSchema(received, schema);

    return {
      name: 'toMatchSchema',
      pass: valid,
      message: () =>
        valid
          ? 'Expected the payload not to match the schema, but it did'
          : [
            'Payload does not match the schema:',
            ...errors.map((error) => `  - ${error}`),
            `Received: ${JSON.stringify(received)}`,
          ].join('\n'),
    };
  },
});

module.exports = { expect };
