import { parseXml, xPath, xPathArray } from '../utils';
import { BaseFeedFormat } from './base';

/**
 * Class to parse RSS feeds
 * @constructor RSSFormat
 */
export class RSSFormat extends BaseFeedFormat {
  /**
   * Parse the given XML.
   * @param {Response} response The {@link https://developer.mozilla.org/en-US/docs/Web/API/Response Response} object containing the XML to parse.
   * @returns {Promise<SearchResult>} The parsed search result as a promise
   */
  parse(response) {
    return response.text().then(text => {
      const xmlDoc = parseXml(text).documentElement;
      const records = xPathArray(xmlDoc, 'channel/item').map((node) => {
        const item = {
          id: xPath(node, 'guid/text()'),
          properties: {
            title: xPath(node, 'title/text()'),
            content: xPath(node, 'description/text()'),
            links: this.parseLinks(node),
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

      return {
        totalResults: parseInt(xPath(xmlDoc, 'channel/os:totalResults/text()'), 10),
        startIndex: parseInt(xPath(xmlDoc, 'channel/os:startIndex/text()'), 10),
        itemsPerPage: parseInt(xPath(xmlDoc, 'channel/os:itemsPerPage/text()'), 10),
        query: {}, // TODO:
        links: this.parseLinks(xmlDoc),
        records,
      };
    });
  }
}
