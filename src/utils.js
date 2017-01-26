import 'isomorphic-fetch';
import xpath from 'xpath';

export function parseURLQuery(url) {
  const search = (url.indexOf('?') === -1) ? url : url.substring(url.indexOf('?'));
  const vars = search.split('&');
  const parsed = {};
  for (let i = 0; i < vars.length; i++) {
    const pair = vars[i].split('=');
    parsed[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1]);
  }
  return parsed;
}

export function parseXml(xmlStr) {
  if (typeof DOMParser !== 'undefined') {
    return (new DOMParser()).parseFromString(xmlStr, 'text/xml');
  } else if (typeof ActiveXObject !== 'undefined') {
    const xmlDoc = new ActiveXObject('Microsoft.XMLDOM'); // eslint-disable-line no-undef
    xmlDoc.async = 'false';
    xmlDoc.loadXML(xmlStr);
    return xmlDoc;
  }
  throw new Error('Could not parse XML document.');
}

export const namespaces = {
  os: 'http://a9.com/-/spec/opensearch/1.1/',
  parameters: 'http://a9.com/-/spec/opensearch/extensions/parameters/1.0/',
  atom: 'http://www.w3.org/2005/Atom',
  georss: 'http://www.georss.org/georss',
  dc: 'http://purl.org/dc/elements/1.1/',
  media: 'http://search.yahoo.com/mrss/',
};

const resolver = {
  lookupNamespaceURI(prefix) {
    return namespaces[prefix];
  },
};


export function xPath(node, query, customResolver) {
  const value = xpath.selectWithResolver(
    query, node, customResolver ? { lookupNamespaceURI: customResolver } : resolver, true
  );

  if (!value) {
    return null;
  }

  if (query.indexOf('text()') !== -1) {
    return value.nodeValue;
  } else if (query.indexOf('@') !== -1) {
    return value.value;
  }
  return value;
}

export function xPathArray(node, query, customResolver) {
  const values = xpath.selectWithResolver(
    query, node, customResolver ? { lookupNamespaceURI: customResolver } : resolver, false
  );
  if (query.indexOf('text()') !== -1) {
    return values.map(value => value.nodeValue);
  } else if (query.indexOf('@') !== -1) {
    return values.map(value => value.value);
  }
  return values;
}

export function getAttributeNS(node, namespace, name, defaultValue) {
  if (node.hasAttributeNS(namespace, name)) {
    return node.getAttributeNS(namespaces.parameters, name);
  }
  return defaultValue;
}

export function fetchAndCheck(...args) {
  return fetch(...args).then((response) => {
    if (response.status >= 400) {
      throw new Error('Bad response from server');
    }
    return response;
  });
}

export function isNullOrUndefined(value) {
  return typeof value === 'undefined' || value === null;
}

/*
 * Forked from https://github.com/mapbox/wellknown/blob/87965f6f46ee38355e7e1f82107aa832ea29bc6c/wellknown.js
 * Removed whitespaces after geometry type to be more robust with some (FedEO)
 * services.
 */

export function toWKT(gj) {
  if (gj.type === 'Feature') {
    gj = gj.geometry;
  }

  function pairWKT (c) {
    return c.join(' ');
  }

  function ringWKT (r) {
    return r.map(pairWKT).join(', ');
  }

  function ringsWKT (r) {
    return r.map(ringWKT).map(wrapParens).join(', ');
  }

  function multiRingsWKT (r) {
    return r.map(ringsWKT).map(wrapParens).join(', ');
  }

  function wrapParens (s) { return '(' + s + ')'; }

  switch (gj.type) {
    case 'Point':
      return 'POINT(' + pairWKT(gj.coordinates) + ')';
    case 'LineString':
      return 'LINESTRING(' + ringWKT(gj.coordinates) + ')';
    case 'Polygon':
      return 'POLYGON(' + ringsWKT(gj.coordinates) + ')';
    case 'MultiPoint':
      return 'MULTIPOINT(' + ringWKT(gj.coordinates) + ')';
    case 'MultiPolygon':
      return 'MULTIPOLYGON(' + multiRingsWKT(gj.coordinates) + ')';
    case 'MultiLineString':
      return 'MULTILINESTRING(' + ringsWKT(gj.coordinates) + ')';
    case 'GeometryCollection':
      return 'GEOMETRYCOLLECTION(' + gj.geometries.map(toWKT).join(', ') + ')';
    default:
      throw new Error('stringify requires a valid GeoJSON Feature or geometry object as input');
  }
}

/**
 * Returns a Request object for the fetch API.
 * @param {string} url The request URL
 * @param {object} [baseRequest] the baseRequest
 * @returns {Request} The constructed request.
 */
export function createRequest(url, baseRequest) {
  return new Request(url, baseRequest);
}

/**
 * Creates (and sends) an XMLHttpRequest.
 * @param {string} url The request URL
 * @param {object} [baseRequest] the baseRequest
 * @returns {XMLHttpRequest} The constructed request.
 */
export function createXHR(url, baseRequest = {}) {
  const xhr = new XMLHttpRequest();

  if (baseRequest.headers) {
    Object.keys(baseRequest.headers).forEach(key => {
      xhr.setRequestHeader(key, baseRequest.headers[key]);
    });
  }
  xhr.open(baseRequest.method || 'GET', url);
  xhr.send(baseRequest.body ? baseRequest.body : null);
  return xhr;
}
