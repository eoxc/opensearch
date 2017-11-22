import { parseXml, getElements, getText } from '../utils';
import { BaseFeedFormat } from './base';

/**
 * Class to parse Atom feeds
 * @constructor AtomFormat
 */
export class AtomFormat extends BaseFeedFormat {
  /**
   * Parse the given XML.
   * @param {string} text The XML string to parse.
   * @returns {module:opensearch/formats.SearchResult} The parsed search result
   */
  parse(text) {
    const xmlDoc = parseXml(text).documentElement;
    const records = getElements(xmlDoc, 'atom', 'entry').map((node) => {
      const entry = {
        id: getText(node, 'dc', 'identifier') || getText(node, 'atom', 'id'),
        properties: {
          title: getText(node, 'atom', 'title'),
          updated: new Date(getText(node, 'atom', 'updated')),
          content: getText(node, 'atom', 'content'),
          summary: getText(node, 'atom', 'summary'),
          links: this.parseLinks(node),
          media: this.parseMedia(node),
          // TODO: further fields
        },
      };

      const box = this.parseBox(node);
      if (box) {
        entry.bbox = box;
      }

      const geometry = this.parseGeometry(node);
      if (geometry) {
        entry.geometry = geometry;

        if (!entry.bbox) {
          entry.bbox = this.getBoxFromGeometry(geometry);
        }
      }

      const date = this.parseDate(node);
      if (date) {
        entry.properties.time = date;
      }

      return entry;
    });

    return {
      totalResults: parseInt(getText(xmlDoc, 'os', 'totalResults'), 10),
      startIndex: parseInt(getText(xmlDoc, 'os', 'startIndex'), 10),
      itemsPerPage: parseInt(getText(xmlDoc, 'os', 'itemsPerPage'), 10),
      query: {}, // TODO:
      links: this.parseLinks(xmlDoc),
      records,
    };
  }
}
