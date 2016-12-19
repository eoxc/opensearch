import 'isomorphic-fetch';

import { OpenSearchDescription } from './description';
import { OpenSearchPaginator } from './paginator';
import { search } from './search';
import { getSupportedTypes } from './formats/';

/**
 * Class to perform searches.
 */
export class OpenSearchService {
  /**
   * Create an OpenSearchDescription object
   * @param {string} osdd The string containing the desription XML
   */
  constructor(osdd) {
    this.descriptionDocument = new OpenSearchDescription(osdd);
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

  getPaginator(parameters, type = null, method = null) {
    return new OpenSearchPaginator(
      this.getUrl(parameters, type, method), parameters
    );
  }
}
