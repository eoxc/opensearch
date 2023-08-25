import {
  parseXml, getElements, getFirstElement, getText,
} from '../utils';
import { BaseFeedFormat } from './base';

/**
 * @module opensearch/formats/rss
 */

/**
 * Class to parse RSS feeds
 * @constructor RSSFormat
 * @implements {module:opensearch/formats.FormatInterface}
 */
export class RSSFormat extends BaseFeedFormat {
  /**
   * Parse the given XML.
   * @param {string} text The XML string to parse.
   * @returns {module:opensearch/formats.SearchResult} The parsed search result
   */
  parse(text, { extraFields = undefined, namespaces = undefined } = {}) {
    const xmlDoc = parseXml(text).documentElement;
    const channel = getFirstElement(xmlDoc, null, 'channel');
    const records = getElements(channel, null, 'item').map((node) => {
      const item = {
        id: getText(node, 'dc', 'identifier') || getText(node, null, 'guid'),
        properties: {
          title: getText(node, null, 'title'),
          content: getText(node, null, 'description'),
          summary: getText(node, null, 'description'),
          links: this.parseLinks(node),
          media: this.parseMedia(node),
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

      const eop = this.parseEOP(node);
      if (eop) {
        item.properties.eop = eop;
      }

      const s3Path = this.parseS3Path(node);
      if (s3Path) {
        item.properties.s3Path = s3Path;
      }

      if (extraFields) {
        this.parseExtraFields(node, extraFields, namespaces, item);
      }

      return item;
    });

    return {
      totalResults: parseInt(getText(channel, 'os', 'totalResults'), 10),
      startIndex: parseInt(getText(channel, 'os', 'startIndex'), 10),
      itemsPerPage: parseInt(getText(channel, 'os', 'itemsPerPage'), 10),
      query: {}, // TODO:
      links: this.parseLinks(xmlDoc),
      records,
    };
  }
}
