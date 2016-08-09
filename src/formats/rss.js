import { parseXml, xPath, xPathArray } from '../utils';

export function parseBox(value) {
  const values = value.split(/\s+/).map(parseFloat);
  return [values[1], values[0], values[3], values[2]];
}

export function parseGeometryValues(value) {
  const values = value.split(/\s+/).map(parseFloat);
  const out = [];

  for (let i = 0; i < values.length; i += 2) {
    const lat = values[i];
    values[i] = values[i + 1];
    values[i + 1] = lat;
    out.push([values[i + 1], values[i]]);
  }
  return out;
}

export function parseGeometry(node) {
  const point = xPath(node, 'georss:point/text()');
  const line = xPath(node, 'georss:line/text()');
  const polygon = xPath(node, 'georss:polygon/text()');
  if (point) {
    return {
      type: 'Point',
      geometry: parseGeometry(point)[0],
    };
  } else if (line) {
    return {
      type: 'LineString',
      geometry: parseGeometry(line),
    };
  } else if (polygon) {
    return {
      type: 'Polygon',
      geometry: parseGeometry(line),
    };
  }
  return null;
}

export class RSSFormat {
  parse(text) {
    const xmlDoc = parseXml(text).documentElement;
    return xPathArray(xmlDoc, 'channel/item').map((node) => {
      const item = {
        id: xPath(node, 'guid/text()'),
        properties: {
          title: xPath(node, 'title/text()'),
          content: xPath(node, 'description/text()'),
          // TODO: further fields + geometry
        },
      };

      const box = xPath(node, 'georss:box/text()');
      if (box) {
        item.bbox = parseBox(box);
      }

      const geometry = parseGeometry(node);
      if (geometry) {
        item.geometry = geometry;
      }

      return item;
    });
  }
}
