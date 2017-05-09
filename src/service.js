import 'isomorphic-fetch';

import { OpenSearchDescription } from './description';
import { OpenSearchPaginator } from './paginator';
import { search } from './search';
import { getSupportedTypes } from './formats/';
import { fetchAndCheck, createXHR } from './utils';
import config from './config';

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
      throw new Error(`No URL found for type '${type}' and the given parameters.`);
    }
    return url;
  }

  /**
   * Checks whether this URL is compatible with the given parameters
   * @param {object} parameters An object mapping the name or type to the value
   * @param {string} [type=null] The preferred transfer type.
   * @param {string} [method=null] The preferred HTTP method type.
   * @param {boolean} [raw=false] Whether the response shall be parsed or returned raw.
   * @returns {Promise<array>|Promise<Response>} The search result as a Promise
   */
  search(parameters, type = null, method = null, raw = false) {
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

    return search(url, parameters, type, raw);
  }

  /**
   * Creates a new Paginator object to enable a simpler search result handling
   * for multi-page results.
   * @param {object} parameters An object mapping the name or type to the value
   * @param {string} [type=null] The preferred transfer type.
   * @param {string} [method=null] The preferred HTTP method type.
   * @param {object} [options] Additional options for the paginator
   * @returns {OpenSearchPaginator} The created Paginator object.
   */
  getPaginator(parameters, type = null, method = null, options = undefined) {
    return new OpenSearchPaginator(
      this.getUrl(parameters, type, method), parameters, options
    );
  }

  /**
   * Accesses an OpenSearch service and discovers it.
   * @param {object} url The URL to find the OpenSearchDescription XML document
   * @returns {Promise<OpenSearchService>} The {@link OpenSearchService} as a Promise
   */
  static discover(url) {
    const { useXHR } = config();
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
      .then(response => response.text())
      .then(response => OpenSearchService.fromXml(response));
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
