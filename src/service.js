import 'isomorphic-fetch';

import { OpenSearchDescription } from './description';
import { OpenSearchPaginator } from './paginator';
import { search, createBaseRequest } from './search';
import { getSupportedTypes } from './formats';
import { fetchAndCheck, createXHR } from './utils';
import { config } from './config';

/**
 * Class to perform searches.
 */
export class OpenSearchService {
  /**
   * Create an OpenSearchDescription object
   * @param {OpenSearchDescription} descriptionDocument The parsed description document
   */
  constructor(descriptionDocument) {
    this.descriptionDocument = descriptionDocument;
  }

  /**
   * Get the underlying {@link OpenSearchDescription} object.
   * @returns {OpenSearchDescription}
   */
  getDescription() {
    return this.descriptionDocument;
  }

  /**
   * Get the URL for the given parameters.
   * @param {object} parameters An object mapping the name or type to the value
   * @param {string} [type=null] The preferred transfer type.
   * @param {string} [method=null] The preferred HTTP method type.
   * @returns {OpenSearchUrl} The resulting URL objec.
   */
  getUrl(parameters, type, method) {
    const url = this.descriptionDocument.getUrl(parameters, type, method);
    if (!url) {
      // try to give better feedback, when just one URL is possible
      const alternativeUrls = this.descriptionDocument.getUrls(null, type, method);
      if (alternativeUrls.length === 1) {
        const missingParamNames = alternativeUrls[0]
          .getMissingMandatoryParameters(parameters)
          .map((p) => `"${p.type}"`);
        const unsupportedParameterKeys = alternativeUrls[0]
          .getUnsupportedParameterKeys(parameters)
          .map((k) => `"${k}"`);

        const terms = [];
        if (missingParamNames.length) {
          terms.push(`missing parameters: ${missingParamNames.join(', ')}`);
        }
        if (unsupportedParameterKeys.length) {
          terms.push(`unsupported parameters keys: ${unsupportedParameterKeys.join(', ')}`);
        }
        throw new Error(`No matching URL found, ${terms.join(' and ')}`);
      }

      // standard error, when multiple/no URLs with that type/method are specified
      throw new Error(`No URL found for type '${type}' and the given parameters.`);
    }
    return url;
  }

  /**
   * Returns a base request object for the given parameters. This allows to
   * inspect the request values before sending them to the server.
   * @param {object} parameters An object mapping the name or type to the value
   * @param {string} [type=null] The preferred transfer type.
   * @param {string} [method=null] The preferred HTTP method type.
   * @returns {object} The search request
   */
  createSearchRequest(parameters, type = null, method = null) {
    let url = null;
    if (!type) {
      // try to find a suitable URL
      const supportedTypes = getSupportedTypes();
      for (let i = 0; i < supportedTypes.length; ++i) {
        url = this.descriptionDocument.getUrl(parameters, supportedTypes[i], method);
        if (url && url.isCompatible(parameters)) {
          break;
        }
      }
      if (!url) {
        throw new Error('No compatible URL found.');
      }
    } else {
      url = this.getUrl(parameters, type, method);
    }

    return createBaseRequest(url, parameters);
  }

  /**
   * Checks whether this URL is compatible with the given parameters
   * @param {object} parameters An object mapping the name or type to the value
   * @param {string} [options.type=null] The preferred transfer type.
   * @param {string} [options.method=null] The preferred HTTP method type.
   * @param {boolean} [options.raw=false] Whether the response shall be parsed or returned raw.
   * @param {number} [options.maxUrlLength=undefined] The maximum URL length. URLs longer than that
   *                                                  will result in errors.
   * @param {boolean} [options.dropEmptyParameters=false] Whether unused parameter keys shall
   *                                                      be dropped from the request.
   * @param {object} [options.parseOptions=undefined] Additional options for the format.
   * @param {object} [options.headers=undefined] Specific headers to send to the service.
   * @returns {Promise<array>|Promise<Response>} The search result as a Promise
   */
  search(parameters, options = {}) {
    const { type = null, method = null } = options;
    let url = null;
    if (!type) {
      // try to find a suitable URL
      const supportedTypes = getSupportedTypes();
      for (let i = 0; i < supportedTypes.length; ++i) {
        url = this.descriptionDocument.getUrl(parameters, supportedTypes[i], method);
        if (url && url.isCompatible(parameters)) {
          break;
        }
      }
      if (!url) {
        throw new Error('No compatible URL found.');
      }
    } else {
      url = this.getUrl(parameters, type, method);
    }

    return search(url, parameters, options);
  }

  /**
   * Gets the suggestions for the current search parameters.
   * @param {object} parameters An object mapping the name or type to the value
   * @param {string} [method=null] The preferred HTTP method type.
   * @param {number} [maxUrlLength=undefined] The maximum URL length. URLs longer than that
   *                                          will result in errors.
   * @returns {Promise<Suggestion[]>} The fetched suggestions.
   */
  getSuggestions(parameters, method = null, maxUrlLength = undefined) {
    const type = 'application/x-suggestions+json';
    let url;
    try {
      url = this.getUrl(parameters, type, method);
    } catch (error) {
      const { Promise } = config();
      return Promise.reject(new Error('No suggestion URL found.'));
    }
    return search(url, parameters, type, false, maxUrlLength);
  }

  /**
   * Creates a new Paginator object to enable a simpler search result handling
   * for multi-page results.
   * @param {object} parameters An object mapping the name or type to the value
   * @param {object} [options={}] Additional options for the paginator
   * @param {string} [options.type=null] The preferred transfer type.
   * @param {string} [options.method=null] The preferred HTTP method type.
   * @returns {OpenSearchPaginator} The created Paginator object.
   */
  getPaginator(parameters, options = {}) {
    const { type = null, method = null } = options;
    return new OpenSearchPaginator(this.getUrl(parameters, type, method), parameters, options);
  }

  /**
   * Accesses an OpenSearch service and discovers it.
   * @param {object} url The URL to find the OpenSearchDescription XML document
   * @returns {Promise<OpenSearchService>} The {@link OpenSearchService} as a Promise
   */
  static discover(url) {
    const { useXHR, Promise } = config();
    if (useXHR) {
      return new Promise((resolve, reject, onCancel) => {
        const xhr = createXHR(url);
        xhr.onload = () => {
          try {
            resolve(OpenSearchService.fromXml(xhr.responseText));
          } catch (error) {
            reject(error);
          }
        };
        xhr.onerror = () => {
          reject(new TypeError('Failed to fetch'));
        };
        if (onCancel && typeof onCancel === 'function') {
          onCancel(() => {
            xhr.abort();
          });
        }
      });
    }
    return fetchAndCheck(url)
      .then((response) => response.text())
      .then((response) => OpenSearchService.fromXml(response));
  }

  /**
   * Create a new {@link OpenSearchService} from an OSDD XML string.
   * @param {string} xml The XML string to parse the description from
   * @returns {OpenSearchService} The created service object
   */
  static fromXml(xml) {
    return new OpenSearchService(OpenSearchDescription.fromXml(xml));
  }

  /**
   * Serialize the service to a simple object.
   * @returns {object} The serialized service description
   */
  serialize() {
    return {
      description: this.descriptionDocument.serialize(),
    };
  }

  /**
   * Deserialize an OpenSearch description from an object.
   * @param {object} values The serialized service description
   * @returns {OpenSearchService} The deserialized service
   */
  static deserialize(values) {
    return new OpenSearchService(
      OpenSearchDescription.deserialize(values.description)
    );
  }
}
