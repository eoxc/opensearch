import { parseXml, xPath, xPathArray } from '../utils';
import { BaseFeedFormat } from './base';

export class RSSFormat extends BaseFeedFormat {
  parse(text) {
    const xmlDoc = parseXml(text).documentElement;
    return xPathArray(xmlDoc, 'channel/item').map((node) => {
      const item = {
        id: xPath(node, 'guid/text()'),
        properties: {
          title: xPath(node, 'title/text()'),
          content: xPath(node, 'description/text()'),
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

        // TODO: calculate bbox as-well, if not already defined
      }

      const date = this.parseDate(node);
      if (date) {
        item.properties.time = date;
      }

      return item;
    });
  }
}
