// TODO: allow client to choose whether or not to use the polyfills

import { polyfill } from 'es6-promise';
polyfill();

import { OpenSearchService } from './service';
import { fetchAndCheck } from './utils';

export async function discover(url) {
  const response = await fetchAndCheck(url);
  if (response.status >= 400) {
    throw new Error('Bad response from server');
  }
  return new OpenSearchService(response.text());
}
