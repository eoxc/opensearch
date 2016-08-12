import { xPath } from '../utils';

function parseGeometryValues(value) {
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


export class BaseFeedFormat {
  parseGeometry(node) {
    const point = xPath(node, 'georss:point/text()');
    const line = xPath(node, 'georss:line/text()');
    const polygon = xPath(node, 'georss:polygon/text()');

    if (point) {
      return {
        type: 'Point',
        geometry: parseGeometryValues(point)[0],
      };
    } else if (line) {
      return {
        type: 'LineString',
        geometry: parseGeometryValues(line),
      };
    } else if (polygon) {
      return {
        type: 'Polygon',
        geometry: parseGeometryValues(line),
      };
    }
    return null;
  }

  parseBox(node) {
    const box = xPath(node, 'georss:box/text()');
    if (box) {
      const values = box.split(/\s+/).map(parseFloat);
      return [values[1], values[0], values[3], values[2]];
    }
    return null;
  }

  parseDate(node) {
    const date = xPath(node, 'dc:date/text()');
    if (date) {
      const values = date.split('/');
      if (values.length === 1) {
        return new Date(date);
      } else if (values.length >= 1) {
        return [new Date(values[0]), new Date(values[1])];
      }
    }
    return null;
  }
}
