import { parseXml, xPath, xPathArray } from '../utils';
import { parseGeometry } from './rss';

export class AtomFormat {
  static testType(type) {
    return type === 'application/atom+xml';
  }

  parse(text) {
    const xmlDoc = parseXml(text).documentElement;
    return xPathArray(xmlDoc, 'atom:entry').map((node) => {
      const entry = {
        id: xPath(node, 'atom:id/text()'),
        title: xPath(node, 'atom:title/text()'),
        updated: new Date(xPath(node, 'atom:updated/text()')),
        content: xPath(node, 'atom:content/text()'),
        // TODO: further fields
      };

      const point = xPath(node, 'georss:point/text()');
      if (point) {
        entry.point = parseGeometry(point);
      }

      const line = xPath(node, 'georss:line/text()');
      if (line) {
        entry.line = parseGeometry(line);
      }

      const box = xPath(node, 'georss:box/text()');
      if (box) {
        entry.box = parseGeometry(box);
      }

      const polygon = xPath(node, 'georss:polygon/text()');
      if (polygon) {
        entry.polygon = parseGeometry(polygon);
      }

      return entry;
    });
  }
}
