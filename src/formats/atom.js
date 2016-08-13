import { parseXml, xPath, xPathArray } from '../utils';
import { BaseFeedFormat } from './base';

/**
 * Class to parse Atom feeds
 */
export class AtomFormat extends BaseFeedFormat {
  /**
   * Parse the given XML.
   * @param {Response} response The Response object containing the XML to parse.
   * @returns {object[]} The parsed records
   */
  parse(response) {
    return response.text().then(text => {
      const xmlDoc = parseXml(text).documentElement;
      return xPathArray(xmlDoc, 'atom:entry').map((node) => {
        const entry = {
          id: xPath(node, 'atom:id/text()'),
          properties: {
            title: xPath(node, 'atom:title/text()'),
            updated: new Date(xPath(node, 'atom:updated/text()')),
            content: xPath(node, 'atom:content/text()'),
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

          // TODO: calculate bbox as-well, if not already defined
        }

        const date = this.parseDate(node);
        if (date) {
          entry.properties.time = date;
        }

        return entry;
      });
    });
  }
}
