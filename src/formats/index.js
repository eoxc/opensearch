import { AtomFormat } from './atom';
import { RSSFormat } from './rss';
import { GeoJSONFormat } from './geojson';

/**
 * @module opensearch/formats
 */

const formatRegistry = {};

/**
 * Function to return the mime-types that are supported by the currently
 * registered formats.
 * @returns {string[]} The supported format mime-types.
 */
export function getSupportedTypes() {
  return Object.keys(formatRegistry);
}

/**
 * Gets the registered format for the given mime-type
 * @param {string} type The mime-type for the format.
 * @returns {object|null} The format object for the given format type or null,
 *                        if no format was registered for that type.
 */
export function getFormat(type) {
  return formatRegistry[type];
}

/**
 * Register a format parser for a given mime-type.
 * @param {string} type The mime-type for the format.
 * @param {object} format The format parser. Shall have a 'parse' method.
 */
export function registerFormat(type, format) {
  formatRegistry[type] = format;
}

registerFormat('application/atom+xml', new AtomFormat);
registerFormat('application/rss+xml', new RSSFormat);
registerFormat('application/json', new GeoJSONFormat);
registerFormat('application/vnd.geo+json', new GeoJSONFormat);
