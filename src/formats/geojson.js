
/**
 * Class to parse GeoJSON results
 * @constructor GeoJSONFormat
 */
export class GeoJSONFormat {
  /**
   * Parse the given JSON.
   * @param {Response} response The {@link https://developer.mozilla.org/en-US/docs/Web/API/Response Response} object containing the XML to parse.
   * @returns {Promise<SearchResult>} The parsed search result as a promise
   */
  parse(response) {
    return response.json().then(result => {
      const records = result.features.map(item => {
        if (!item.hasOwnProperty('id') && item.properties.hasOwnProperty('id')) {
          return Object.assign({
            id: item.properties.id,
          }, item);
        }
        return item;
      });

      return {
        // TODO: parse properties of featurecollection
        records,
      };
    });
  }
}
