import { parseXml, xPath, xPathArray } from '../utils';
import { parseGeometry, parseBox } from './rss';

export class AtomFormat {
  static testType(type) {
    return type === 'application/atom+xml';
  }

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

      const box = xPath(node, 'georss:box/text()');
      if (box) {
        entry.bbox = parseBox(box);
      }

      const geometry = parseGeometry(node);
      if (geometry) {
        entry.geometry = geometry;
      }

      return entry;
    });
  }
}
