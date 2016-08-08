import { OpenSearchUrl } from './url';
import { parseXml, xPathArray } from './utils';

export class OpenSearchDescription {
  constructor(xml) {
    this.urls = null;
    this.parseDocument(xml);
  }

  parseDocument(xml) {
    // TODO: parse XML and get list of URLs
    const xmlDoc = parseXml(xml).documentElement;
    this.urls = xPathArray(xmlDoc, '/os:Url').map((node) => OpenSearchUrl.fromNode(node));
  }

  getURL(mimeType, method = 'GET') {
    // https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Array/find#Polyfill
    return this.urls.find((url) => url.mimeType === mimeType && url.method === method);
  }
}
