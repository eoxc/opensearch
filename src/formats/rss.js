import { parseXml, xPath, xPathArray } from '../utils';

export function parseGeometry(value) {
  const values = value.split(/\s+/).map(parseFloat);
  for (let i = 0; i < values.length; i += 2) {
    const lat = values[i];
    values[i] = values[i + 1];
    values[i + 1] = lat;
  }
  return values;
}

export class RSSFormat {
  static testType(type) {
    return type === 'application/atom+xml';
  }

  parse(text) {
    const xmlDoc = parseXml(text).documentElement;
    return xPathArray(xmlDoc, 'channel/item').map((node) => {
      return {
        title: xPath(node, 'title/text()'),
        content: xPath(node, 'description/text()'),
        // TODO: further fields + geometry
      };
    });
  }
}
