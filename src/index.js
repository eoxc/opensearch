import { OpenSearchService } from './service';
import { fetchAndCheck } from './utils';

/**
 * @module opensearch
 */

/**
 * Accesses an OpenSearch service and discovers it.
 * @param {object} string The URL to find the OpenSearchDescription XML document
 * @returns {Promise<OpenSearchService>} The {@link OpenSearchService} as a Promise
 */
export function discover(url) {
  return fetchAndCheck(url)
    .then(response => response.text())
    .then(response => new OpenSearchService(response));
}
