import 'isomorphic-fetch';

import { OpenSearchDescription } from './description';
import { fetchAndCheck } from './utils';
import { getFormat } from './formats/';

export class OpenSearchService {
  constructor(osdd) {
    this.descriptionDocument = new OpenSearchDescription(osdd);
  }

  search(parameters, mimeType, raw = false) {
    const url = this.descriptionDocument.getURL(mimeType);
    fetchAndCheck(url.createRequest(parameters)).then((response) => {
      if (raw) {
        return response;
      }
      const format = getFormat(mimeType);
      return format.parse(response);
    });
  }
}
