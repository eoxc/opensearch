import { OpenSearchDescription } from './description';

export class OpenSearchService {
  constructor(osdd) {
    this.descriptionDocument = new OpenSearchDescription(osdd);
  }

  search(parameters) {

  }
}
