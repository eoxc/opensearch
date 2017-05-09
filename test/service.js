/* eslint no-unused-expressions: ["off"] */

import { expect } from 'chai';
import { OpenSearchService } from '../src/service';

// import fetchMock after isomorphic-fetch was set up to not confuse global `Request`
// eslint-disable-next-line import/first
import fetchMock from 'fetch-mock';

const osddExample = require('./data/OSDD_example.xml');
const atomExample = require('./data/atom_example.xml');

describe('OpenSearchService', () => {
  before(() => {
    fetchMock
      .mock('begin:http://example.com/?q=', atomExample)
      .mock('http://example.com/', osddExample);
  });
  after(() => {
    fetchMock.restore();
  });

  describe('constructor', () => {
    it('shall parse the description', () => {
      const service = OpenSearchService.fromXml(osddExample);
      expect(service).to.exist;
      expect(service.descriptionDocument).to.exist;
    });
  });

  describe('#search()', () => {
    const service = OpenSearchService.fromXml(osddExample);
    it('shall search', () => (
      service.search({ searchTerms: 'terms' })
        .then((results) => {
          expect(results.records).to.have.lengthOf(1);
        })
    ));
  });

  describe('serialize()/deserialize()', () => {
    const service = OpenSearchService.fromXml(osddExample);
    it('deserialized objects shall be equal to the original objects ', () => {
      const deserializedService = OpenSearchService.deserialize(service.serialize());
      expect(service).to.deep.equal(deserializedService);
    });
  });
});
