import { OpenSearchUrl } from './url';
import { parseXml, xPath, xPathArray } from './utils';

function resolver(prefix) {
  if (prefix === 'os') {
    return 'http://a9.com/-/spec/opensearch/1.1/';
  }
  return null;
}

export class OpenSearchDescription {
  constructor(xml) {
    // parse XML and get metadata and list of URLs
    const xmlDoc = parseXml(xml).documentElement;

    this.shortName = xPath(xmlDoc, 'os:ShortName/text()', resolver);
    this.description = xPath(xmlDoc, 'os:Description/text()', resolver);
    this.tags = xPath(xmlDoc, 'os:Tags/text()', resolver);
    this.contact = xPath(xmlDoc, 'os:Contact/text()', resolver);
    this.urls = xPathArray(xmlDoc, 'os:Url', resolver).map(
      (node) => OpenSearchUrl.fromNode(node)
    );
    this.longName = xPath(xmlDoc, 'os:LongName/text()', resolver);
    this.images = xPathArray(xmlDoc, 'os:Image', resolver).map((node) => {
      return {
        height: parseInt(node.getAttribute('height')),
        width: parseInt(node.getAttribute('width')),
        type: node.getAttribute('type'),
        url: node.textContent,
      };
    });
    this.queries = xPathArray(xmlDoc, 'os:Query', resolver).map((node) => {
      const query = { role: node.getAttribute('role') };
      for (let i = 0; i < node.attributes.length; ++i) {
        let attribute = node.attributes[i];
        query[attribute.name] = attribute.value;
      }
      return query;
    });
    this.developer = xPath(xmlDoc, 'os:Developer/text()', resolver);
    this.attribution = xPath(xmlDoc, 'os:Attribution/text()', resolver);
    this.syndicationRight = xPath(xmlDoc, 'os:SyndicationRight/text()', resolver);
    this.adultContent = xPath(xmlDoc, 'os:AdultContent/text()', resolver);
    this.language = xPath(xmlDoc, 'os:Language/text()', resolver);
    this.outputEncoding = xPath(xmlDoc, 'os:OutputEncoding/text()', resolver);
    this.inputEncoding = xPath(xmlDoc, 'os:InputEncoding/text()', resolver);
  }

  getUrl(type, method = 'GET') {
    const urls = this.urls.filter((url) => url.type === type && url.method === method);
    // TODO: filter according to parameters
    return urls[0];
  }
}
