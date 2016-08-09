import { OpenSearchService } from './service';
import { fetchAndCheck } from './utils';

export function discover(url) {
  return fetchAndCheck(url)
    .then(response => response.text())
    .then(response => new OpenSearchService(xml));
}
