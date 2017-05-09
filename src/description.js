import { OpenSearchUrl } from './url';
import { parseXml, xPath, xPathArray, find, assign } from './utils';

/**
 * Class to parse the OpenSearchDescription XML document and get the saerch URLs
 */
export class OpenSearchDescription {
  /**
   * Create an OpenSearchDescription object
   * @param {object} values The object containing the parsed description
   * @param {string} [values.shortName] The short name of the OpenSearch service
   * @param {string} [values.description] The description of the service
   * @param {string} [values.tags] The associated tags of the service
   * @param {string} [values.contact] The contact information of the service
   * @param {OpenSearchUrl[]} [values.urls] The parsed URLs of the service
   * @param {string} [values.longName] The long name of the service
   * @param {object[]} [values.images] The associated images of the service
   * @param {object[]} [values.queries] Prepared queries for the service
   * @param {string} [values.developer] The developer information of the service
   * @param {string} [values.attribution] The attribution for the service
   * @param {string} [values.syndicationRight] Syndication rights for the service
   * @param {string} [values.adultContent] Information about the adult content of the service
   * @param {string} [values.language] The language settings for the service
   * @param {string} [values.outputEncoding] The output encoding
   * @param {string} [values.inputEncoding] The input encoding
   */
  constructor(values) {
    this.shortName = values.shortName;
    this.description = values.description;
    this.tags = values.tags;
    this.contact = values.contact;
    this.urls = values.urls;
    this.longName = values.longName;
    this.images = values.images;
    this.queries = values.queries;
    this.developer = values.developer;
    this.attribution = values.attribution;
    this.syndicationRight = values.syndicationRight;
    this.adultContent = values.adultContent;
    this.language = values.language;
    this.outputEncoding = values.outputEncoding;
    this.inputEncoding = values.inputEncoding;
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
    let urls = this.urls.filter(url => find(url.relations, rel => rel === 'results'));

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
        url => url.isCompatible(parameters)
      );
    }
    return urls;
  }

  /**
   * Parse an OpenSearch Description XML Document.
   * @param {string} xml The XML String to parse.
   * @returns {OpenSearchDescription} The parsed description document
   */
  static fromXml(xml) {
    const xmlDoc = parseXml(xml).documentElement;

    const values = {
      shortName: xPath(xmlDoc, 'os:ShortName/text()'),
      description: xPath(xmlDoc, 'os:Description/text()'),
      tags: xPath(xmlDoc, 'os:Tags/text()'),
      contact: xPath(xmlDoc, 'os:Contact/text()'),
      urls: xPathArray(xmlDoc, 'os:Url').map(
        node => OpenSearchUrl.fromNode(node)
      ),
      longName: xPath(xmlDoc, 'os:LongName/text()'),
      images: xPathArray(xmlDoc, 'os:Image').map(node => ({
        height: parseInt(node.getAttribute('height'), 10),
        width: parseInt(node.getAttribute('width'), 10),
        type: node.getAttribute('type'),
        url: node.textContent,
      })),
      queries: xPathArray(xmlDoc, 'os:Query').map((node) => {
        const query = { role: node.getAttribute('role') };
        for (let i = 0; i < node.attributes.length; ++i) {
          const attribute = node.attributes[i];
          query[attribute.name] = attribute.value;
        }
        return query;
      }),
      developer: xPath(xmlDoc, 'os:Developer/text()'),
      attribution: xPath(xmlDoc, 'os:Attribution/text()'),
      syndicationRight: xPath(xmlDoc, 'os:SyndicationRight/text()'),
      adultContent: xPath(xmlDoc, 'os:AdultContent/text()'),
      language: xPath(xmlDoc, 'os:Language/text()'),
      outputEncoding: xPath(xmlDoc, 'os:OutputEncoding/text()'),
      inputEncoding: xPath(xmlDoc, 'os:InputEncoding/text()'),
    };
    return new OpenSearchDescription(values);
  }

  /**
   * Serialize the OpenSearch description to a simple object.
   * @returns {object} The serialized description
   */
  serialize() {
    return {
      shortName: this.shortName,
      description: this.description,
      tags: this.tags,
      contact: this.contact,
      urls: this.urls.map(url => url.serialize()),
      longName: this.longName,
      images: this.images,
      queries: this.queries,
      developer: this.developer,
      attribution: this.attribution,
      syndicationRight: this.syndicationRight,
      adultContent: this.adultContent,
      language: this.language,
      outputEncoding: this.outputEncoding,
      inputEncoding: this.inputEncoding,
    };
  }

  /**
   * Deserialize an OpenSearch description from an object.
   * @param {object} values The serialized description
   * @returns {OpenSearchDescription} The deserialized description
   */
  static deserialize(values) {
    return new OpenSearchDescription(assign({}, values, {
      urls: values.urls.map(urlDesc => OpenSearchUrl.deserialize(urlDesc)),
    }));
  }
}
