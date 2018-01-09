/**
 * @module opensearch/config
 */

/**
 * The global configuration.
 */
const globalConfig = {
  useXHR: false,
};

/**
 * Retrieve config values or set one or more config values at once.
 * @param {object} [values] The new values to set. If omitted, just return the
 *                          current configuration.
 * @returns {object} The current configuration.
 */
export function config(values = null) {
  if (!values) {
    return globalConfig;
  }
  for (const key in values) {
    if (Object.prototype.hasOwnProperty.call(values, key)) {
      globalConfig[key] = values[key];
    }
  }
  return globalConfig;
}
