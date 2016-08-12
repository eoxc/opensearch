import 'isomorphic-fetch';


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
};

function resolver(prefix) {
  return namespaces[prefix];
}

export function xPath(node, xpath) {
  const doc = node.ownerDocument;
  const text = xpath.indexOf('text()') !== -1 || xpath.indexOf('@') !== -1;
  if (text) {
    return doc.evaluate(xpath, node, resolver, XPathResult.STRING_TYPE, null).stringValue;
  }
  const result = doc.evaluate(
    xpath, node, resolver, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null
  );
  if (result.snapshotLength === 0) {
    return null;
  }
  return result.snapshotItem(0);
}

export function xPathArray(node, xpath) {
  const doc = node.ownerDocument;
  const result = doc.evaluate(
    xpath, node, resolver, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null
  );
  const text = xpath.indexOf('text()') !== -1 || xpath.indexOf('@') !== -1;
  const array = new Array(result.snapshotLength);
  for (let i = 0; i < result.snapshotLength; ++i) {
    if (text) {
      array[i] = result.snapshotItem(i).textContent;
    } else {
      array[i] = result.snapshotItem(i);
    }
  }
  return array;
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
