import { parseXml, xPath, xPathArray } from '../utils';
import { BaseFeedFormat } from './base';

/**
 * Class to parse RSS feeds
 * @constructor RSSFormat
 */
export class RSSFormat extends BaseFeedFormat {
  /**
   * Parse the given XML.
   * @param {string} text The XML string to parse.
   * @returns {SearchResult} The parsed search result
   */
  parse(text) {
    const xmlDoc = parseXml(text).documentElement;
    const records = xPathArray(xmlDoc, 'channel/item').map((node) => {
      const item = {
        id: xPath(node, 'dc:identifier/text()') || xPath(node, 'guid/text()'),
        properties: {
          title: xPath(node, 'title/text()'),
          content: xPath(node, 'description/text()'),
          summary: xPath(node, 'description/text()'),
          links: this.parseLinks(node),
          media: this.parseMedia(node),
          // TODO: further fields + geometry
        },
      };

      const box = this.parseBox(node);
      if (box) {
        item.bbox = box;
      }

      const geometry = this.parseGeometry(node);
      if (geometry) {
        item.geometry = geometry;

        if (!item.bbox) {
          item.bbox = this.getBoxFromGeometry(geometry);
        }
      }

      const date = this.parseDate(node);
      if (date) {
        item.properties.time = date;
      }

      return item;
    });

    return {
      totalResults: parseInt(xPath(xmlDoc, 'channel/os:totalResults/text()'), 10),
      startIndex: parseInt(xPath(xmlDoc, 'channel/os:startIndex/text()'), 10),
      itemsPerPage: parseInt(xPath(xmlDoc, 'channel/os:itemsPerPage/text()'), 10),
      query: {}, // TODO:
      links: this.parseLinks(xmlDoc),
      records,
    };
  }
}
