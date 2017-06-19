import { getElements, getFirstElement, getText } from '../utils';

function swapAndPair(values) {
  const out = [];

  for (let i = 0; i < values.length; i += 2) {
    const lat = values[i];
    const lon = values[i + 1];
    out.push([lon, lat]);
  }
  return out;
}

function parseGeometryValues(value) {
  const values = value.trim().split(/\s+/).map(parseFloat);
  return swapAndPair(values);
}

function parseGmlLine(node) {
  return swapAndPair(getText(node, node.namespaceURI, 'posList')
    .trim()
    .split(/\s+/)
    .map(parseFloat));
}

function parseGmlPolygon(node, namespaceURI) {
  const exteriorElement = getFirstElement(node, namespaceURI, 'exterior');
  const interiorElements = getElements(node, namespaceURI, 'interior');

  const exterior = parseGmlLine(
    getFirstElement(exteriorElement, namespaceURI, 'LinearRing'), namespaceURI
  );

  const interiors = interiorElements
    .map(interiorElement => parseGmlLine(
      getFirstElement(interiorElement, namespaceURI, 'LinearRing'), namespaceURI
    ));
  return [exterior, ...interiors];
}

function parseGml(node) {
  switch (node.localName) {
    case 'Point': {
      const coordinates = getText(node, node.namespaceURI, 'pos')
        .trim()
        .split(/\s+/)
        .map(parseFloat);
      return {
        type: 'Point',
        coordinates: [coordinates[1], coordinates[0]],
      };
    }
    case 'LineString': {
      const coordinates = parseGmlLine(node, node.namespaceURI);
      return {
        type: 'LineString',
        coordinates,
      };
    }
    case 'Polygon': {
      const coordinates = parseGmlPolygon(node, node.namespaceURI);
      return {
        type: 'Polygon',
        coordinates,
      };
    }
    case 'Envelope': {
      // TODO:
      break;
    }
    case 'MultiSurface': {
      // support both single 'surfaceMembers' or multiple 'surfaceMember' elements
      let polygons = getElements(node, node.namespaceURI, 'surfaceMember')
        .map(surfaceMember => getFirstElement(surfaceMember, surfaceMember.namespaceURI, 'Polygon'));
      const surfaceMembers = getFirstElement(node, node.namespaceURI, 'surfaceMembers');
      if (surfaceMembers) {
        polygons = polygons.concat(getElements(surfaceMembers, surfaceMembers.namespaceURI, 'Polygon'));
      }
      const coordinates = polygons.map(polygon => parseGmlPolygon(polygon, node.namespaceURI));
      return {
        type: 'MultiPolygon',
        coordinates,
      };
    }
    default:
      break;
  }
  return null;
}

function boxFromLineString(lineString) {
  let minX = null;
  let minY = null;
  let maxX = null;
  let maxY = null;

  for (let i = 0; i < lineString.length; ++i) {
    const [x, y] = lineString[i];
    minX = (minX === null || x < minX) ? x : minX;
    minY = (minY === null || y < minY) ? y : minY;
    maxX = (maxX === null || x > maxX) ? x : maxX;
    maxY = (maxY === null || y > maxY) ? y : maxY;
  }
  return [minX, minY, maxX, maxY];
}

export class BaseFeedFormat {
  parseGeometry(node) {
    const where = getFirstElement(node, 'georss', 'where');
    const point = getText(node, 'georss', 'point');
    const line = getText(node, 'georss', 'line');
    const polygon = getText(node, 'georss', 'polygon');

    if (where) {
      if (where.firstElementChild)
        return parseGml(where.firstElementChild);
      else {
        return parseGml(where);
      }
    } else if (point) {
      return {
        type: 'Point',
        coordinates: parseGeometryValues(point)[0],
      };
    } else if (line) {
      return {
        type: 'LineString',
        coordinates: parseGeometryValues(line),
      };
    } else if (polygon) {
      return {
        type: 'Polygon',
        coordinates: [parseGeometryValues(polygon)],
      };
    }
    return null;
  }

  parseBox(node) {
    const box = getText(node, 'georss', 'box');
    if (box) {
      const values = box.split(/\s+/).map(parseFloat);
      return [values[1], values[0], values[3], values[2]];
    }
    return null;
  }

  getBoxFromGeometry(geometry) {
    const coords = geometry.coordinates;
    switch (geometry.type) {
      case 'Point':
        return [coords[0], coords[1], coords[0], coords[1]];
      case 'LineString':
        return boxFromLineString(coords);
      case 'Polygon':
        return boxFromLineString(coords[0]);
      case 'MultiPolygon': {
        const bboxes = coords.map(polygon => boxFromLineString(polygon[0]));
        const outBox = bboxes[0];
        for (let i = 1; i < bboxes.length; ++i) {
          const box = bboxes[i];
          outBox[0] = Math.min(outBox[0], box[0]);
          outBox[1] = Math.min(outBox[1], box[1]);
          outBox[2] = Math.max(outBox[2], box[2]);
          outBox[3] = Math.max(outBox[3], box[3]);
        }
        return outBox;
      }
      default:
        return null;
    }
  }

  parseDate(node) {
    const date = getText(node, 'dc', 'date');
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

  parseLinks(node) {
    return getElements(node, 'atom', 'link').map((linkNode) => {
      const link = {
        href: linkNode.getAttribute('href'),
      };
      const rel = linkNode.getAttribute('rel');
      const type = linkNode.getAttribute('type');
      const title = linkNode.getAttribute('title');
      if (rel) {
        link.rel = rel;
      }
      if (type) {
        link.type = type;
      }
      if (title) {
        link.title = title;
      }

      return link;
    });
  }

  parseMedia(node) {
    return getElements(node, 'media', 'content')
      .concat(getElements(getFirstElement(node, 'media', 'group'), 'media', 'content'))
      .map((mediaNode) => {
        const category = getFirstElement(mediaNode, 'media', 'category');
        return {
          url: mediaNode.getAttribute('url'),
          category: category ? category.textContent : undefined,
          scheme: category ? category.getAttribute('scheme') : undefined,
        };
      });
  }
}
