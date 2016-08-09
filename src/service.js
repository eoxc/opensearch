import 'isomorphic-fetch';

import { OpenSearchDescription } from './description';
import { fetchAndCheck } from './utils';
import { getFormat, getSupportedTypes } from './formats/';

export class OpenSearchService {
  constructor(osdd) {
    this.descriptionDocument = new OpenSearchDescription(osdd);
  }

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
    fetchAndCheck(...url.createRequest(parameters)).then((response) => {
      if (raw) {
        return response;
      }

      const format = getFormat(type);
      if (!format) {
        throw new Error(`Could not parse response of type '${type}'.`);
      }
      return format.parse(response);
    });
  }
}
