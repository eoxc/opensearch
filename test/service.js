/* eslint no-unused-expressions: ["off"] */

import fetchMock from 'fetch-mock';

import { expect } from 'chai';
import { OpenSearchService } from '../src/service';

const osddExample = require('./data/OSDD_example.xml');
const atomExample = require('./data/atom_example.xml');

describe('OpenSearchService', () => {
  before(() => {
    fetchMock
      .mock('^http://example.com/?q=', atomExample)
      .mock('http://example.com/', osddExample);
  });
  after(() => {
    fetchMock.restore();
  });

  describe('constructor', () => {
    it('shall parse the description', () => {
      const service = new OpenSearchService(osddExample);
      expect(service).to.exist;
      expect(service.descriptionDocument).to.exist;
    });
  });

  describe('#search()', () => {
    const service = new OpenSearchService(osddExample);
    it('shall search', () => (
      service.search({ searchTerms: 'terms' })
        .then((results) => {
          expect(results.records).to.have.lengthOf(1);
        })
    ));
  });
});
