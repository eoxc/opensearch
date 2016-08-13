

export class GeoJSONFormat {
  /**
   * Parse the given JSON.
   * @param {string} text The text containing the JSON to parse.
   * @returns {object[]} The parsed records
   */
  parse(text) {
    return JSON.parse(text).features.map((item) => {
      if (!item.hasOwnProperty('id') && item.properties.hasOwnProperty('id')) {
        return Object.assign({
          id: item.properties.id,
        }, item);
      }
      return item;
    });
  }
}
