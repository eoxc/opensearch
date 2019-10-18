/* eslint no-underscore-dangle:
  ["error", { "allow": ["_parametersByName", "_parametersByType"] }]
*/

import parse from 'url-parse';

import { getFormat } from './formats';
import { createRequest, createXHR } from './utils';
import { getErrorFromXml } from './error';
import { config } from './config';

/**
 * @module opensearch/search
 */

 /**
  * @typedef module:opensearch/search.BaseRequest
  * @type Object
  * @property {string} url The URL of the search service.
  * @property {string} method The ussed HTTP method.
  * @property {object} [headers] Optional HTTP headers.
  * @property {string|FormData} [body] The body to be sent to the search service.
  *                                    (For HTTP POST requests)
  */

/**
 * Returns an object that can be transformed into a fetch Request or an
 * XMLHttpRequest.
 * @param {string} url The url to send the search request to.
 * @param {object} parameterValues The search parameter values.
 * @param {boolean} [options.dropEmptyParameters=false] Whether unused parameter keys shall
 *                                                      be dropped from the request.
 * @param {object} headers Additional headers to set on the request.
 * @returns {module:opensearch/search.BaseRequest} The constructed base request object.
 */
export function createBaseRequest(url, parameterValues, dropEmptyParameters, headers) {
  // check parameters
  Object.keys(parameterValues).forEach((key) => {
    if (!Object.prototype.hasOwnProperty.call(url._parametersByType, key)
        && !Object.prototype.hasOwnProperty.call(url._parametersByName, key)) {
      throw new Error(`Invalid parameter '${key}'.`);
    }
  });

  const missingMandatoryParameters = url.getMissingMandatoryParameters(parameterValues)
    .map(parameter => parameter.type);

  if (missingMandatoryParameters.length) {
    throw new Error(`Missing mandatory parameters: ${missingMandatoryParameters.join(', ')}`);
  }

  // serialize the parameters
  const serialized = url.serializeValues(parameterValues);

  // depending on the request method, create the request 'body' or query string
  if (url.method === 'GET') {
    // insert parameters into URL template
    let urlString = url.url;

    for (let i = 0; i < serialized.length; ++i) {
      const [, type, value] = serialized[i];
      urlString = urlString.replace(new RegExp(`{${type}[?]?}`), value);
    }

    if (dropEmptyParameters) {
      const parsed = parse(urlString, false);
      const query = parsed.query.split('&')
        .map(param => param.split('='))
        .filter(paramParts => paramParts[1] !== '')
        .map(paramParts => paramParts.join('='))
        .join('&');

      parsed.set('query', query);
      urlString = parsed.toString();
    }

    return {
      method: url.method,
      url: urlString,
      headers,
    };
  }

  // for POST
  const enctype = url.enctype || 'application/x-www-form-urlencoded';
  let body = null;
  if (enctype === 'application/x-www-form-urlencoded') {
    body = serialized
      .map(([name, , value]) => `${encodeURIComponent(name)}=${encodeURIComponent(value)}`)
      .join('&');
  } else if (enctype === 'multipart/form-data') {
    body = new FormData();
    serialized.forEach(([name, , value]) => body.append(name, value));
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
 * @param {object} [options={}] Additional options.
 * @param {string} [options.type=null] The response format.
 * @param {boolean} [options.raw=false] Whether the response shall be parsed or returned raw.
 * @param {number} [options.maxUrlLength=undefined] The maximum URL length.
 *                                                  URLs longer than that
 *                                                  will result in errors.
 * @param {boolean} [options.dropEmptyParameters=false] Whether unused parameter keys shall
 *                                                      be dropped from the request.
 * @param {object} [options.parseOptions=undefined] Additional options for the format.
 * @param {object} [options.headers=undefined] Specific headers to send to the service.
 * @returns {Promise<SearchResult>|Promise<Response>} The search result as a Promise
 */
export function search(url, parameters = {}, options = {}) {
  const { type, raw, maxUrlLength, dropEmptyParameters, parseOptions, headers } = options;

  const baseRequest = createBaseRequest(url, parameters, dropEmptyParameters, headers);
  const { useXHR, Promise } = config();

  if (typeof maxUrlLength !== 'undefined' && baseRequest.url.length > maxUrlLength) {
    return Promise.reject(new Error(`Search URL too long: ${baseRequest.url.length}, maximum: ${maxUrlLength}`));
  }

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
      return format.parse(text, parseOptions);
    });
}
