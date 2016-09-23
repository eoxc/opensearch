import { xPath, xPathArray } from '../utils';

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

function parseGmlLine(node, resolver) {
  return swapAndPair(xPath(node, 'gml:posList/text()', resolver)
    .trim()
    .split(/\s+/)
    .map(parseFloat));
}

function parseGmlPolygon(node, resolver) {
  const exterior = parseGmlLine(
    xPath(node, 'gml:exterior/gml:LinearRing', resolver), resolver
  );
  const interiors = xPathArray(node, 'gml:interior/gml:LinearRing', resolver)
    .map(interior => parseGmlLine(interior, resolver));
  return [exterior, ...interiors];
}

function parseGml(node) {
  const resolver = (prefix) => {
    if (prefix === 'gml') {
      return node.namespaceURI;
    }
    return null;
  };

  switch (node.localName) {
    case 'Point': {
      const coordinates = xPath(node, 'gml:pos/text()', resolver)
        .trim()
        .split(/\s+/)
        .map(parseFloat);
      return {
        type: 'Point',
        coordinates: [coordinates[1], coordinates[0]],
      };
    }
    case 'LineString': {
      const coordinates = parseGmlLine(node, resolver);
      return {
        type: 'LineString',
        coordinates,
      };
    }
    case 'Polygon': {
      const coordinates = parseGmlPolygon(node, resolver);
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
      const coordinates = xPathArray(
        node, 'gml:surfaceMembers/gml:Polygon|gml:surfaceMember/gml:Polygon', resolver)
        .map(polygon => parseGmlPolygon(polygon, resolver));
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

export class BaseFeedFormat {
  parseGeometry(node) {
    const where = xPath(node, 'georss:where');
    const point = xPath(node, 'georss:point/text()');
    const line = xPath(node, 'georss:line/text()');
    const polygon = xPath(node, 'georss:polygon/text()');

    if (where) {
      return parseGml(xPath(where, '*'));
    } else if (point) {
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
        geometry: parseGeometryValues(polygon),
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

  parseLinks(node) {
    return xPathArray(node, 'atom:link').map(linkNode => {
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
    return xPathArray(node, 'media:content').map(mediaNode => ({
      url: mediaNode.getAttribute('url'),
      category: xPath(mediaNode, 'media:category/text()'),
      scheme: xPath(mediaNode, 'media:category/@scheme'),
    }));
  }
}
