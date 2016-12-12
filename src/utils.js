import 'isomorphic-fetch';
import xpath from 'xpath';

import { getFormat } from './formats'

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
  if (typeof window.DOMParser !== 'undefined') {
    return (new window.DOMParser()).parseFromString(xmlStr, 'text/xml');
  } else if (typeof ActiveXObject !== 'undefined') {
    const xmlDoc = new window.ActiveXObject('Microsoft.XMLDOM');
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

/**
 * Performs a search for the given URL and parameters.
 * @param {OpenSearchUrl} url The URL to search on.
 * @param {object} [parameters={}] The search parameters.
 * @param {string} [type=null] The response format.
 * @param {boolean} [raw=false] Whether the response shall be parsed or returned raw.
 * @returns {Promise<array>|Promise<Response>} The search result as a Promise
 */
export function search(url, parameters = {}, type = null, raw = false) {
  return fetchAndCheck(url.createRequest(parameters))
    .then(response => {
      if (raw) {
        return response;
      }

      const format = getFormat(type || url.type);
      if (!format) {
        throw new Error(`Could not parse response of type '${type}'.`);
      }
      return format.parse(response);
    });
}
