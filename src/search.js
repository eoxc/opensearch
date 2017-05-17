/* eslint no-underscore-dangle:
  ["error", { "allow": ["_parametersByName", "_parametersByType"] }]
*/

import { getFormat } from './formats';
import { createRequest, createXHR } from './utils';
import { getErrorFromXml } from './error';
import config from './config';


/*
 * Returns an object that can be transformed into a fetch Request or an
 * XMLHttpRequest.
 */
function createBaseRequest(url, parameterValues) {
  // check parameters
  Object.keys(parameterValues).forEach((key) => {
    if (!Object.prototype.hasOwnProperty.call(url._parametersByType, key)
        && !Object.prototype.hasOwnProperty.call(url._parametersByName, key)) {
      throw new Error(`Invalid parameter '${key}'.`);
    }
  });

  const missingMandatoryParameters = url.parameters.filter(
    parameter => parameter.mandatory
      && !Object.prototype.hasOwnProperty.call(parameterValues, parameter.name)
      && !Object.prototype.hasOwnProperty.call(parameterValues, parameter.type)
  ).map(parameter => parameter.type);

  const missingOptionalParameters = url.parameters.filter(
    parameter => !parameter.mandatory
      && !Object.prototype.hasOwnProperty.call(parameterValues, parameter.name)
      && !Object.prototype.hasOwnProperty.call(parameterValues, parameter.type)
  ).map(parameter => parameter.type);

  if (missingMandatoryParameters.length) {
    throw new Error(`Missing mandatory parameters: ${missingMandatoryParameters.join(', ')}`);
  }

  if (url.method === 'GET') {
    // insert parameters into URL template
    let urlString = url.url;

    Object.keys(parameterValues).forEach((key) => {
      const parameter = url._parametersByType[key] || url._parametersByName[key];
      urlString = urlString.replace(
        new RegExp(`{${parameter.type}[?]?}`),
        parameter.serializeValue(parameterValues[key])
      );
    });

    missingOptionalParameters.forEach((type) => {
      urlString = urlString.replace(new RegExp(`{${type}[?]?}`), '');
    });

    return {
      method: url.method,
      url: urlString,
    };
  }

  // for POST
  const enctype = url.enctype || 'application/x-www-form-urlencoded';
  let body = null;
  if (enctype === 'application/x-www-form-urlencoded') {
    body = Object.keys(parameterValues).map((key) => {
      const param = (url._parametersByType[key] || url._parametersByName[key]);
      const k = encodeURIComponent(param.name);
      const v = encodeURIComponent(param.serializeValue(parameterValues[key]));
      return `${k}=${v}`;
    }).join('&');
  } else if (enctype === 'multipart/form-data') {
    body = new FormData();
    Object.keys(parameterValues).forEach((key) => {
      const param = (url._parametersByType[key] || url._parametersByName[key]);
      body.append(param.name, param.serializeValue(parameterValues[key]));
    });
  } else {
    throw new Error(`Unsupported enctype '${enctype}'.`);
  }

  return {
    method: url.method,
    url: url.url,
    headers: {
      'Content-Type': enctype,
    },
    body,
  };
}

/**
 * Performs a search for the given URL and parameters.
 * @param {OpenSearchUrl} url The URL to search on.
 * @param {object} [parameters={}] The search parameters.
 * @param {string} [type=null] The response format.
 * @param {boolean} [raw=false] Whether the response shall be parsed or returned raw.
 * @param {boolean} [useXHR=false] Whether to use `XMLHttpRequest`s or the `fetch` API.
 * @param {object} [PromiseClass=Promise] What Promise class to use to wrap XHR requests.
 * @returns {Promise<SearchResult>|Promise<Response>} The search result as a Promise
 */
export function search(url, parameters = {}, type = null, raw = false) {
  const baseRequest = createBaseRequest(url, parameters);
  const { useXHR } = config();

  let request = null;

  // Decide whether to use XHR or fetch
  if (useXHR) {
    request = new Promise((resolve, reject, onCancel) => {
      const xhr = createXHR(baseRequest.url, baseRequest);
      xhr.onload = () => {
        if (raw) {
          resolve(xhr);
        }
        resolve([xhr.responseText, xhr.status]);
      };

      xhr.onerror = () => {
        reject(new TypeError('Failed to fetch'));
      };

      // set up cancellation if available
      if (onCancel && typeof onCancel === 'function') {
        onCancel(() => {
          xhr.abort();
        });
      }
    });
  } else {
    // fetch API
    request = fetch(createRequest(baseRequest.url, baseRequest));
    if (raw) {
      return request;
    }
    request = request.then(response => response.text().then(text => [text, response.status]));
  }

  // postprocess, check for error and parse result
  return request
    .then(([text, status]) => {
      if (status >= 400) {
        const error = getErrorFromXml(text);
        throw (error || new Error(text));
      }
      const format = getFormat(type || url.type);
      if (!format) {
        throw new Error(`Could not parse response of type '${type}'.`);
      }
      return format.parse(text);
    });
}
