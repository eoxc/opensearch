// TODO: allow client to choose whether or not to use the polyfills

import { polyfill } from 'es6-promise';
polyfill();

import 'isomorphic-fetch';


import { OpenSearchService } from './service';


export async function service(url) {
  const response = await fetch(url);
  if (response.status >= 400) {

  }
  return fetch(url)
    .then((response) => {
      if (response.status >= 400) {
        throw new Error('Bad response from server');
      }
      return new OpenSearchService(response.text());
    });
}
