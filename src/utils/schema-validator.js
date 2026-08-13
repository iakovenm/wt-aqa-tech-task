/**
 * JSON Schema validation for API response contracts.
 *
 * Backed by Ajv, so the contracts in `src/api/schemas/` may use the full JSON
 * Schema vocabulary (`enum`, `oneOf`, `format`, nested `required`, …) rather
 * than a hand-picked subset. Compiled validators are cached per schema object,
 * so a data-driven spec compiles each contract once.
 */

const Ajv = require('ajv');

const ajv = new Ajv({
  // Report every violation, not just the first: a contract mismatch is easier
  // to diagnose from the complete list.
  allErrors: true,
  // Reject schemas with unknown keywords or ignored combinations, so a typo in
  // a contract fails loudly instead of silently validating nothing.
  strict: true,
});

/** @type {WeakMap<object, import('ajv').ValidateFunction>} */
const compiled = new WeakMap();

/**
 * Compiles a schema once and reuses the validator on later calls.
 *
 * @param {object} schema - Schema to compile.
 * @returns {import('ajv').ValidateFunction} Cached validator.
 */
function validatorFor(schema) {
  let validate = compiled.get(schema);
  if (!validate) {
    validate = ajv.compile(schema);
    compiled.set(schema, validate);
  }
  return validate;
}

/**
 * Validates a value against a schema and collects every violation.
 *
 * @param {*} value - Value to validate, typically a parsed response body.
 * @param {object} schema - Schema to validate against.
 * @returns {{valid: boolean, errors: string[]}} Validation outcome; `errors` is
 *   empty when the value is valid.
 */
function validateSchema(value, schema) {
  const validate = validatorFor(schema);
  const valid = validate(value);

  const errors = (validate.errors ?? []).map((error) => {
    const path = error.instancePath === '' ? '$' : `$${error.instancePath.replace(/\//g, '.')}`;
    const detail = error.params?.additionalProperty
      ? `${error.message} (${error.params.additionalProperty})`
      : error.message;
    return `${path}: ${detail}`;
  });

  return { valid, errors };
}

module.exports = { validateSchema };
