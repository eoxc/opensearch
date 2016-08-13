export class GeoJSONFormat {
  /**
   * Parse the given JSON.
   * @param {Response} response The response containing the JSON to parse.
   * @returns {object[]} The parsed records
   */
  parse(response) {
    response.json().then(result => result.features.map(item => {
      if (!item.hasOwnProperty('id') && item.properties.hasOwnProperty('id')) {
        return Object.assign({
          id: item.properties.id,
        }, item);
      }
      return item;
    }));
  }
}
