import { assign } from '../utils';


/**
 * @module opensearch/formats/geojson
 */

/**
 * Class to parse GeoJSON results
 * @constructor GeoJSONFormat
 * @implements {module:opensearch/formats.FormatInterface}
 */
export class GeoJSONFormat {
  /**
   * Parse the given JSON.
   * @param {string} text The JSON string to parse.
   * @returns {module:opensearch/formats.SearchResult} The parsed search result
   */
  parse(text) {
    const result = JSON.parse(text);
    const records = result.features.map((item) => {
      if (!Object.prototype.hasOwnProperty.call(item, 'id') && Object.prototype.hasOwnProperty.call(item.properties, 'id')) {
        return assign({
          id: item.properties.id,
        }, item);
      }
      return item;
    });

    return {
      // TODO: parse properties of featurecollection
      records,
    };
  }
}
