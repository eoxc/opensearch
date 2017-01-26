
/**
 * The global configuration.
 */
const config = {
  PromiseClass: Promise,
  useXHR: false,
}

export function getPromiseClass() {
  return config.PromiseClass;
}

export function setPromiseClass(PromiseClass) {
  config.PromiseClass = PromiseClass;
}

export function getUseXHR() {
  return config.useXHR;
}

export function setUseXHR(useXHR) {
  config.useXHR = useXHR;
}

/**
 * Retrieve config values or set one or more config values at once.
 * @param {object} [values] The new values to set. If omitted, just return the
 *                          current configuration.
 * @returns {object} The current configuration.
 */
export default function(values = null) {
  if (!values) {
    return config;
  }
  for (let key in values) {
    if (values.hasOwnProperty(key)) {
      config[key] = values[key];
    }
  }
  return config;
}
