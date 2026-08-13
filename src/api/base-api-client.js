const Logger = require('../utils/logger');

/**
 * Transport-level base class for API clients.
 *
 * Wraps Playwright's `APIRequestContext` so every concrete client (see
 * `user-api-client.js`) works with a uniform `{status, body, headers}` result
 * and gets request logging for free. New endpoints only need a subclass.
 */
class BaseApiClient {
  /**
   * @param {import('@playwright/test').APIRequestContext} request - Playwright request context.
   * @param {string} [basePath=''] - Path prefix prepended to every request (e.g. '/v1').
   */
  constructor(request, basePath = '') {
    this.request = request;
    this.basePath = basePath;
    this.logger = new Logger(process.env.DEBUG_LOGS === 'true');
  }

  /**
   * Issues a request and normalises the response.
   *
   * @param {'get'|'post'|'put'|'patch'|'delete'} method - HTTP method.
   * @param {string} path - Path relative to `basePath`.
   * @param {{params?: object, data?: *, headers?: object}} [options={}] - Request options.
   * @returns {Promise<{status: number, ok: boolean, headers: object, body: *, raw: import('@playwright/test').APIResponse}>}
   *   Normalised response; `body` is the parsed JSON, or the raw text when the payload is not JSON.
   */
  async send(method, path, options = {}) {
    const url = `${this.basePath}${path}`;
    this.logger.debugLog(`${method.toUpperCase()} ${url}`, options.params ?? '', options.data ?? '');

    const response = await this.request[method](url, {
      params: options.params,
      data: options.data,
      headers: options.headers,
      // Never throw on 4xx/5xx — negative cases assert on those statuses.
      failOnStatusCode: false,
    });

    const body = await BaseApiClient.parseBody(response);
    this.logger.debugLog(`<- ${response.status()}`, body);

    return {
      status: response.status(),
      ok: response.ok(),
      headers: response.headers(),
      body,
      raw: response,
    };
  }

  /**
   * Parses a response body as JSON, falling back to text.
   *
   * @param {import('@playwright/test').APIResponse} response - Response to read.
   * @returns {Promise<*>} Parsed JSON, raw text, or null for an empty body.
   */
  static async parseBody(response) {
    const text = await response.text();
    if (text === '') return null;
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  }
}

module.exports = BaseApiClient;
