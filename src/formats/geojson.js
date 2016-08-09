export class GeoJSONFormat {
  static testType(type) {
    return type === 'application/json' || type === 'application/vnd.geo+json';
  }

  parse(text) {
    return JSON.parse(text).features.map((item) => {
      if (!item.hasOwnProperty('id') && item.properties.hasOwnProperty('id')) {
        item.id = item.properties.id;
      }
      return item;
    });
  }
}
