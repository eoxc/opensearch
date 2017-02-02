import { getFormat } from './formats'
import { fetchAndCheck, createRequest, createXHR } from './utils';
import config from './config';


/*
 * Returns an object that can be transformed into a fetch Request or an
 * XMLHttpRequest.
 */
function createBaseRequest(url, parameterValues) {
  // check parameters
  Object.keys(parameterValues).forEach(key => {
    if (!url._parametersByType.hasOwnProperty(key)
        && !url._parametersByName.hasOwnProperty(key)) {
      throw new Error(`Invalid parameter '${key}'.`);
    }
  });

  const missingMandatoryParameters = url.parameters.filter(
    (parameter) => parameter.mandatory
      && !parameterValues.hasOwnProperty(parameter.name)
      && !parameterValues.hasOwnProperty(parameter.type)
  ).map((parameter) => parameter.type);

  const missingOptionalParameters = url.parameters.filter(
    (parameter) => !parameter.mandatory
      && !parameterValues.hasOwnProperty(parameter.name)
      && !parameterValues.hasOwnProperty(parameter.type)
  ).map((parameter) => parameter.type);

  if (missingMandatoryParameters.length) {
    throw new Error(`Missing mandatory parameters: ${missingMandatoryParameters.join(', ')}`);
  }

  if (url.method === 'GET') {
    // insert parameters into URL template
    let urlString = url.url;

    Object.keys(parameterValues).forEach(key => {
      const parameter = url._parametersByType[key] || url._parametersByName[key];
      urlString = urlString.replace(
        new RegExp(`{${parameter.type}[?]?}`),
        parameter.serialize(parameterValues[key])
      );
    });

    missingOptionalParameters.forEach(type => {
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
    body = Object.keys(parameterValues).map(key => {
      const param = (url._parametersByType[key] || url._parametersByName[key]);
      const k = encodeURIComponent(param.name);
      const v = encodeURIComponent(param.serialize(parameterValues[key]));
      return `${k}=${v}`;
    }).join('&');
  } else if (enctype === 'multipart/form-data') {
    body = new FormData();
    Object.keys(parameterValues).forEach(key => {
      const param = (url._parametersByType[key] || url._parametersByName[key]);
      body.append(param.name, param.serialize(parameterValues[key]));
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
  // XHR API
  if (useXHR) {
    return new Promise((resolve, reject, onCancel) => {
      const xhr = createXHR(baseRequest.url, baseRequest);
      xhr.onload = () => {
        if (raw) {
          resolve(xhr);
        }

        try {
          const format = getFormat(type || url.type);
          if (!format) {
            throw new Error(`Could not parse response of type '${type}'.`);
          }
          resolve(format.parse(xhr.responseText));
        } catch(error) {
          reject(error);
        }
      };

      xhr.onerror = (event) => {
        reject(event);
      };

      if (onCancel && typeof onCancel === 'function') {
        onCancel(() => {
          xhr.abort();
        });
      }
    });
  }

  // fetch API
  const request = fetchAndCheck(createRequest(baseRequest.url, baseRequest));
  if (raw) {
    return request;
  }
  return request
    .then(response => response.text())
    .then(text => {
      const format = getFormat(type || url.type);
      if (!format) {
        throw new Error(`Could not parse response of type '${type}'.`);
      }
      return format.parse(text);
    });
}
