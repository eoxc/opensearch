import { AtomFormat } from './atom';
import { RSSFormat } from './rss';
import { GeoJSONFormat } from './geojson';

const formatRegistry = [AtomFormat, RSSFormat, GeoJSONFormat];

export function getFormat(type) {
  for (let i = 0; i < formatRegistry.length; ++i) {
    if (formatRegistry[i].testType(type)) {
      return new formatRegistry[i];
    }
  }
  throw new Error(`Unsupported type '${type}'.`);
}

export function registerFormat(format) {
  if (formatRegistry.indexOf(format) !== -1) {
    formatRegistry.push(format);
  }
}
