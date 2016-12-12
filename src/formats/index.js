import { AtomFormat } from './atom';
import { RSSFormat } from './rss';
import { GeoJSONFormat } from './geojson';


/**
 * @module opensearch/formats
 */

 /**
  * @typedef Record
  * @type Object
  * @property {string} id The id of the record
  * @property {object} properties The parsed properties of the record
  * @property {object} [geometry] The parsed record geometry
  * @property {float[]} [bbox] The parsed record geometry
  */

 /**
  * @typedef SearchResult
  * @type Object
  * @property {int} [totalResults] The total amount of matched records
  * @property {int} [startIndex] The start index of this response
  * @property {int} [itemsPerPage] The number of items per page of results
  * @property {object} [query] The query of this result
  * @property {object[]} [links] Relevant links of this result
  * @property {Record[]} records The parsed records
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
