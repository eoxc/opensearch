import 'isomorphic-fetch';

import { OpenSearchDescription } from './description';
import { fetchAndCheck } from './utils';
import { getFormat, getSupportedTypes } from './formats/';

/**
 * Class to perform searches.
 */
export class OpenSearchService {
  /**
   * Create an OpenSearchDescription object
   * @param {string} xml The string containing the desription XML
   */
  constructor(osdd) {
    this.descriptionDocument = new OpenSearchDescription(osdd);
  }

  /**
   * Checks whether this URL is compatible with the given parameters
   * @param {object} parameters An object mapping the name or type to the value
   * @param {string} [type=null] The preferred transfer type.
   * @param {boolean} [raw=false] Whether the response shall be parsed or returned raw.
   * @returns {Promise<array>|Promise<Response>} The search result as a Promise
   */
  search(parameters, type = null, raw = false) {
    let url = null;
    if (!type) {
      // try to find a suitable URL
      const supportedTypes = getSupportedTypes();
      for (let i = 0; i < supportedTypes.length; ++i) {
        url = this.descriptionDocument.getUrl(parameters, supportedTypes[i]);
        if (url && url.isCompatible(parameters)) {
          break;
        }
      }
      if (!url) {
        throw new Error('No compatible URL found.');
      }
    } else {
      url = this.descriptionDocument.getUrl(parameters, type);
      if (!url) {
        throw new Error(`No URL found for type '${type}' and the given parameters.`);
      }
    }

    // actually perform the search
    return fetchAndCheck(url.createRequest(parameters))
      .then(response => response.text())
      .then(response => {
        if (raw) {
          return response;
        }

        const format = getFormat(type || url.type);
        if (!format) {
          throw new Error(`Could not parse response of type '${type}'.`);
        }
        return format.parse(response);
      });
  }
}
