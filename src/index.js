import { OpenSearchService } from './service';
import config from './config';

/**
 * @module opensearch
 */

/**
 * Accesses an OpenSearch service and discovers it.
 * @param {object} url The URL to find the OpenSearchDescription XML document
 * @returns {Promise<OpenSearchService>} The {@link OpenSearchService} as a Promise
 */
export function discover(url) {
  return OpenSearchService.discover(url);
}

/**
 * Deserialize a previously serialized {@link OpenSearchService}.
 * @param {object} values The serialized service description
 * @returns {OpenSearchService} The deserialized service
 */
export function deserialize(values) {
  return OpenSearchService.deserialize(values);
}

export { config };
