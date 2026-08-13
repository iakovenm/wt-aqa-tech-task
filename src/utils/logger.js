/**
 * Opt-in debug logger.
 *
 * Request/response details are printed only when `DEBUG_LOGS=true`, so they are
 * available while investigating a failure without polluting normal runs.
 */
class Logger {
  /**
   * @param {boolean} [debug=false] - Whether `debugLog()` writes anything.
   */
  constructor(debug = false) {
    this.debug = debug;
  }

  /**
   * @param {...*} messages - Values to log when debug output is enabled.
   */
  debugLog(...messages) {
    if (this.debug) {
      console.debug('[DEBUG]', ...messages);
    }
  }
}

module.exports = Logger;
