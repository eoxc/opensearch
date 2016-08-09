import { AtomFormat } from './atom';
import { RSSFormat } from './rss';
import { GeoJSONFormat } from './geojson';

const formatRegistry = {
  'application/atom+xml': AtomFormat,
  'application/rss+xml': RSSFormat,
  'application/json': GeoJSONFormat,
  'application/vnd.geo+json': GeoJSONFormat,
};

export function getSupportedTypes() {
  return Object.keys(formatRegistry);
}

export function getFormat(type) {
  return formatRegistry[type];
}

export function registerFormat(type, format) {
  formatRegistry[type] = format;
}
