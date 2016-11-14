import { OpenSearchUrl } from './url';
import { parseXml, xPath, xPathArray } from './utils';

/**
 * Class to parse the OpenSearchDescription XML document and get the saerch URLs
 */
export class OpenSearchDescription {
  /**
   * Create an OpenSearchDescription object
   * @param {string} xml The string containing the desription XML
   */
  constructor(xml) {
    // parse XML and get metadata and list of URLs
    const xmlDoc = parseXml(xml).documentElement;

    this.shortName = xPath(xmlDoc, 'os:ShortName/text()');
    this.description = xPath(xmlDoc, 'os:Description/text()');
    this.tags = xPath(xmlDoc, 'os:Tags/text()');
    this.contact = xPath(xmlDoc, 'os:Contact/text()');
    this.urls = xPathArray(xmlDoc, 'os:Url').map(
      (node) => OpenSearchUrl.fromNode(node)
    );
    this.longName = xPath(xmlDoc, 'os:LongName/text()');
    this.images = xPathArray(xmlDoc, 'os:Image').map((node) => { // eslint-disable-line
      return {
        height: parseInt(node.getAttribute('height'), 10),
        width: parseInt(node.getAttribute('width'), 10),
        type: node.getAttribute('type'),
        url: node.textContent,
      };
    });
    this.queries = xPathArray(xmlDoc, 'os:Query').map((node) => {
      const query = { role: node.getAttribute('role') };
      for (let i = 0; i < node.attributes.length; ++i) {
        const attribute = node.attributes[i];
        query[attribute.name] = attribute.value;
      }
      return query;
    });
    this.developer = xPath(xmlDoc, 'os:Developer/text()');
    this.attribution = xPath(xmlDoc, 'os:Attribution/text()');
    this.syndicationRight = xPath(xmlDoc, 'os:SyndicationRight/text()');
    this.adultContent = xPath(xmlDoc, 'os:AdultContent/text()');
    this.language = xPath(xmlDoc, 'os:Language/text()');
    this.outputEncoding = xPath(xmlDoc, 'os:OutputEncoding/text()');
    this.inputEncoding = xPath(xmlDoc, 'os:InputEncoding/text()');
  }

  /**
   * Get the {@link OpenSearchUrl} for the given parameters, mime type and HTTP
   * method. Return the first matching URL or null.
   * @param {object} [parameters=null] An object containing search parameters
   * @param {string} [type=null] The mime-type for the URL
   * @param {string} [method='GET'] The preferred HTTP method of the URL
   * @returns {OpenSearchUrl|null}
   */
  getUrl(...args) {
    const urls = this.getUrls(...args);
    if (urls.length) {
      return urls[0];
    }
    return null;
  }

  /**
   * Get an array of {@link OpenSearchUrl} for the given parameters, mime type and HTTP
   * method.
   * @param {object} [parameters=null] An object containing search parameters
   * @param {string|Array} [type=null] The mime-type for the URL
   * @param {string|Array} [method=null] The preferred HTTP method of the URL
   * @returns {OpenSearchUrl[]}
   */
  getUrls(parameters = null, type = null, method = null) {
    let urls = this.urls;

    if (type) {
      urls = urls.filter(
        url => (Array.isArray(type) ? type.indexOf(url.type) > -1 : url.type === type)
      );
    }
    if (method) {
      urls = urls.filter(
        url => (Array.isArray(method) ? method.indexOf(url.method) > -1 : url.method === method)
      );
    }

    if (parameters) {
      return urls.filter(
        (url) => url.isCompatible(parameters)
      );
    }
    return urls;
  }
}
