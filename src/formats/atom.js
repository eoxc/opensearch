import { parseXml, xPath, xPathArray } from '../utils';
import { BaseFeedFormat } from './base';

export class AtomFormat extends BaseFeedFormat {
  parse(text) {
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
  }
}
