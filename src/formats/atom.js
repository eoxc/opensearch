import { parseXml, xPath, xPathArray } from '../utils';
import { BaseFeedFormat } from './base';

/**
 * Class to parse Atom feeds
 * @constructor AtomFormat
 */
export class AtomFormat extends BaseFeedFormat {
  /**
   * Parse the given XML.
   * @param {Response} response The {@link https://developer.mozilla.org/en-US/docs/Web/API/Response Response} object containing the XML to parse.
   * @returns {Promise<SearchResult>} The parsed search result as a promise
   */
  parse(response) {
    return response.text().then(text => {
      const xmlDoc = parseXml(text).documentElement;
      const records = xPathArray(xmlDoc, 'atom:entry').map((node) => {
        const entry = {
          id: xPath(node, 'dc:identifier/text()') || xPath(node, 'atom:id/text()'),
          properties: {
            title: xPath(node, 'atom:title/text()'),
            updated: new Date(xPath(node, 'atom:updated/text()')),
            content: xPath(node, 'atom:content/text()'),
            summary: xPath(node, 'atom:summary/text()'),
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
        totalResults: parseInt(xPath(xmlDoc, 'os:totalResults/text()'), 10),
        startIndex: parseInt(xPath(xmlDoc, 'os:startIndex/text()'), 10),
        itemsPerPage: parseInt(xPath(xmlDoc, 'os:itemsPerPage/text()'), 10),
        query: {}, // TODO:
        links: this.parseLinks(xmlDoc),
        records,
      };
    });
  }
}
