import 'isomorphic-fetch';

/**
 * @module opensearch/utils
 */

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
  } if (typeof ActiveXObject !== 'undefined') {
    const xmlDoc = new ActiveXObject('Microsoft.XMLDOM'); // eslint-disable-line no-undef
    xmlDoc.async = 'false';
    xmlDoc.loadXML(xmlStr);
    return xmlDoc;
  }
  throw new Error('Could not parse XML document.');
}

/*
 * Some common namespace definitions
 */
export const namespaces = {
  os: 'http://a9.com/-/spec/opensearch/1.1/',
  parameters: 'http://a9.com/-/spec/opensearch/extensions/parameters/1.0/',
  atom: 'http://www.w3.org/2005/Atom',
  georss: 'http://www.georss.org/georss',
  dc: 'http://purl.org/dc/elements/1.1/',
  media: 'http://search.yahoo.com/mrss/',

  // EOP and OM related namespaces
  opt: 'http://www.opengis.net/opt/2.1',
  om: 'http://www.opengis.net/om/2.0',
  eop: 'http://www.opengis.net/eop/2.0',
};

/*
 * Get an array of all child elements
 */
function getChildren(element) {
  if (element.children) {
    return Array.from(element.children);
  }
  return Array.from(element.childNodes).filter((node) => node.nodeType === 1); // Node.ELEMENT_NODE
}

/*
 * Get an array of all *direct* descendants (in contrast to getElementsByTagName)
 * of an element with a certain namespace URI and tag name.
 */
export function getElements(element, namespace, tagName, usedNamespaces = namespaces) {
  if (!element) {
    return [];
  }
  const namespaceURI = usedNamespaces[namespace] || namespace;
  const children = getChildren(element);
  if (tagName && namespaceURI) {
    return children.filter(
      (child) => child.localName === tagName && child.namespaceURI === namespaceURI
    );
  } if (tagName) {
    return children.filter((child) => child.localName === tagName);
  }
  return children;
}

/*
 * Get the first direct descendant element with the given namespace URI and tag name.
 */
export function getFirstElement(element, namespace, tagName, usedNamespaces) {
  // use shortcut; when available
  if (!namespace && !tagName && element.firstElementChild) {
    return element.firstElementChild;
  }
  const elements = getElements(element, namespace, tagName, usedNamespaces);
  if (elements.length) {
    return elements[0];
  }
  return null;
}

/*
 * Get the text of the first direct descendant element with the given namespace
 * URI and tag name.
 */
export function getText(element, namespace, tagName, usedNamespaces) {
  const first = getFirstElement(element, namespace, tagName, usedNamespaces);
  return first ? first.textContent : null;
}

/*
 * Get the value of the namespaced attribute or return a default.
 */
export function getAttributeNS(node, namespace, name, defaultValue, usedNamespaces = namespaces) {
  const namespaceURI = usedNamespaces[namespace] || namespace;
  if (node.hasAttributeNS(namespaceURI, name)) {
    return node.getAttributeNS(namespaceURI, name);
  }
  return defaultValue;
}

function splitNamespace(name) {
  return (name.indexOf(':') !== -1) ? name.split(':') : [null, name];
}

/**
 * Resolves an xPath like query with the given element as basis. All parts of
 * the path must be specified, none may be omitted. Allows to select attributes
 * using the `@attrName` postfix or the text of an element using the `text()`
 * as the last path part.
 * @param {object} element The root element to start the query on. Must be a DOM
 *                         compliant object.
 * @param {string} path The search path: parts are separated by the `/` character
 *                      and may contain a supported namespace prefix (separated
 *                      by the color character).
 *                      Examples: `os:Url@type`, `atom:entry/atom:title/text()`,
 *                      `channel/item/georss:box/text()`
 * @param {boolean} [single=false] Whether multiple elements are expected. When
 *                                 false, an array is returned, otherwise single
 *                                 values.
 * @returns {object|string|object[]|string[]} Depending on the query and the
 *                                            single parameter, either a DOM Node
 *                                            or a string, or arrays thereof.
 */
export function simplePath(element, path, single = false, usedNamespaces = undefined) {
  // split path and discard empty parts
  const parts = path.split('/').filter((part) => part.length);
  let current = single ? element : [element];

  for (let i = 0; i < parts.length; ++i) {
    const part = parts[i];

    // single values are treated differently
    if (single) {
      if (part === 'text()') {
        return current.textContent;
      } if (part.indexOf('@') !== -1) {
        const [nodePart, attrPart] = part.split('@');
        const [namespace, tagName] = splitNamespace(nodePart);
        const [attrNamespace, attrName] = splitNamespace(attrPart);
        current = getFirstElement(current, namespace, tagName, usedNamespaces);
        return current
          ? getAttributeNS(current, attrNamespace, attrName, undefined, usedNamespaces) : null;
      }
      const [namespace, tagName] = splitNamespace(part);
      current = getFirstElement(current, namespace, tagName, usedNamespaces);
      if (!current) {
        return null;
      }
    } else if (part === 'text()') {
      return current.map((currentElement) => currentElement.textContent);
    } else if (part.indexOf('@') !== -1) {
      const [nodePart, attrPart] = part.split('@');
      const [namespace, tagName] = splitNamespace(nodePart);
      const [attrNamespace, attrName] = splitNamespace(attrPart);
      return current.map(
        (currentElement) => getElements(currentElement, namespace, tagName, usedNamespaces)
      )
        .reduce((acc, value) => acc.concat(value), [])
      // eslint-disable-next-line max-len
        .map((finalElement) => getAttributeNS(finalElement, attrNamespace, attrName, undefined, usedNamespaces));
    } else {
      const [namespace, tagName] = splitNamespace(part);
      current = current.map(
        (currentElement) => getElements(currentElement, namespace, tagName, usedNamespaces)
      )
        .reduce((acc, value) => acc.concat(value), []);
    }
  }

  return current;
}

// adapted from https://developer.mozilla.org/en-US/Add-ons/Code_snippets/LookupPrefix
// Private function for lookupPrefix only
// eslint-disable-next-line no-underscore-dangle
function _lookupNamespacePrefix(namespaceURI, originalElement) {
  const xmlnsPattern = /^xmlns:(.*)$/;
  if (originalElement.namespaceURI && originalElement.namespaceURI === namespaceURI
    && originalElement.lookupNamespaceURI(originalElement.prefix) === namespaceURI) {
    return originalElement.prefix;
  }
  if (originalElement.attributes && originalElement.attributes.length) {
    for (let i = 0; i < originalElement.attributes.length; i++) {
      const att = originalElement.attributes[i];
      xmlnsPattern.lastIndex = 0;
      let localName = att.localName || att.name.substr(att.name.indexOf(':') + 1); // latter test for IE which doesn't support localName
      if (localName.indexOf(':') !== -1) { // For Firefox when in HTML mode
        localName = localName.substr(att.name.indexOf(':') + 1);
      }
      if (xmlnsPattern.test(att.name) && att.value === namespaceURI) {
        return localName;
      }
    }
  }
  if (originalElement.parentNode) {
    // EntityReferences may have to be skipped to get to it
    return _lookupNamespacePrefix(namespaceURI, originalElement.parentNode);
  }
  return null;
}

/**
 * Looks up the the namespace prefix on the given DOM Node and the given namespace
 * @param {DOMNode} node The node to look up the namespace prefix
 * @param {String} namespaceURI The namespace URI to look up the namespace definition
 * @returns {String} The namespace prefix
 */
export function lookupPrefix(node, namespaceURI) {
  // Depends on private function _lookupNamespacePrefix() below and on https://developer.mozilla.org/En/Code_snippets/LookupNamespaceURI
  // http://www.w3.org/TR/DOM-Level-3-Core/core.html#Node3-lookupNamespacePrefix
  // http://www.w3.org/TR/DOM-Level-3-Core/namespaces-algorithms.html#lookupNamespacePrefixAlgo
  // (The above had a few apparent 'bugs' in the pseudo-code which were corrected here)
  if (node.lookupPrefix) { // Shouldn't use this in text/html for Mozilla as will return null
    return node.lookupPrefix(namespaceURI);
  }
  if (namespaceURI === null || namespaceURI === '') {
    return null;
  }
  switch (node.nodeType) {
    case 1: // Node.ELEMENT_NODE
      return _lookupNamespacePrefix(namespaceURI, node);
    case 9: // Node.DOCUMENT_NODE
      return _lookupNamespacePrefix(namespaceURI, node.documentElement);
    case 6: // Node.ENTITY_NODE
    case 12: // Node.NOTATION_NODE
    case 11: // Node.DOCUMENT_FRAGMENT_NODE
    case 10: // Node.DOCUMENT_TYPE_NODE
      return null; // type is unknown
    case 2: // Node.ATTRIBUTE_NODE
      if (node.ownerElement) {
        return _lookupNamespacePrefix(namespaceURI, node.ownerElement);
      }
      return null;
    default:
      if (node.parentNode) {
        // EntityReferences may have to be skipped to get to it
        return _lookupNamespacePrefix(namespaceURI, node.parentNode);
      }
      return null;
  }
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

/* eslint-disable no-param-reassign, prefer-template */

export function toWKT(gj) {
  if (gj.type === 'Feature') {
    gj = gj.geometry;
  }

  function wrapParens(s) { return '(' + s + ')'; }

  function pairWKT(c) {
    return c.join(' ');
  }

  function ringWKT(r) {
    return r.map(pairWKT).join(', ');
  }

  function ringsWKT(r) {
    return r.map(ringWKT).map(wrapParens).join(', ');
  }

  function multiRingsWKT(r) {
    return r.map(ringsWKT).map(wrapParens).join(', ');
  }

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

/* eslint-enable no-param-reassign, prefer-template */

/**
 * Returns a [Request]{@link https://developer.mozilla.org/en-US/docs/Web/API/Request}
 * object for the fetch API.
 * @param {string} url The request URL
 * @param {object} [baseRequest] the baseRequest
 * @returns {Request} The constructed request.
 */
export function createRequest(url, baseRequest) {
  return new Request(url, baseRequest);
}

/**
 * Creates (and sends) an [XMLHttpRequest]{@link https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest}.
 * @param {string} url The request URL
 * @param {object} [baseRequest] the baseRequest
 * @returns {XMLHttpRequest} The constructed request.
 */
export function createXHR(url, baseRequest = {}) {
  const xhr = new XMLHttpRequest();
  xhr.open(baseRequest.method || 'GET', url);
  if (baseRequest.headers) {
    Object.keys(baseRequest.headers).forEach((key) => {
      xhr.setRequestHeader(key, baseRequest.headers[key]);
    });
  }
  xhr.send(baseRequest.body ? baseRequest.body : null);
  return xhr;
}

/**
 * Sort of polyfill for [Array.prototype.find]{@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/find}
 * @param {Array} arr the array to find the entry on.
 * @param {function} predicate the callback to find the value.
 * @param {*} thisArg the `this` for the predicate function.
 * @returns {*} the found item or undefined
 */
export function find(arr, predicate, thisArg) {
  if (Array.prototype.find) {
    return arr.find(predicate, thisArg);
  }
  for (let i = 0; i < arr.length; ++i) {
    const v = arr[i];
    if (predicate(v, i, arr)) {
      return v;
    }
  }
  return undefined;
}

/**
 * Sort of polyfill for [Object.assign]{@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/assign}
 * @param {object} target the target to set the properties on.
 * @param {...object} sources the source objects to copy properties from.
 * @returns {object} the target
 */
export function assign(target, ...sources) {
  if (Object.assign) {
    return Object.assign(target, ...sources);
  }
  for (let i = 0; i < sources.length; ++i) {
    const source = sources[i];
    if (source) {
      for (const key in source) {
        if (Object.prototype.hasOwnProperty.call(source, key)) {
          target[key] = source[key]; // eslint-disable-line no-param-reassign
        }
      }
    }
  }
  return target;
}
