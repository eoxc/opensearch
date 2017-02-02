import { OpenSearchService } from './service';
import { fetchAndCheck, createXHR } from './utils';
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
  const { useXHR } = config();
  if (useXHR) {
    return new Promise((resolve, reject, onCancel) => {
      const xhr = createXHR(url);
      xhr.onload = () => {
        try {
          resolve(new OpenSearchService(xhr.responseText));
        } catch(error) {
          reject(error);
        }
      };
      xhr.onerror = (event) => {
        reject(event);
      }
      if (onCancel && typeof onCancel === 'function') {
        onCancel(() => {
          xhr.abort();
        });
      }
    });
  }
  return fetchAndCheck(url)
    .then(response => response.text())
    .then(response => new OpenSearchService(response));
}

export { config };
