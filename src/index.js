import { OpenSearchService } from './service';
import { config } from './config';

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
 * Creates a new {@link OpenSearchService} from the given XML string containing
 *                                         the OpenSearch description document.
 * @param {string} xml The XML string containing the OpenSearch description document.
 * @returns {OpenSearchService} The {@link OpenSearchService}
 */
export function fromXml(xml) {
  return OpenSearchService.fromXml(xml);
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
