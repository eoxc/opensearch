/* eslint no-unused-expressions: ["off"] */

import { expect } from 'chai';
import { OpenSearchService } from '../src/service';

// import fetchMock after isomorphic-fetch was set up to not confuse global `Request`
// eslint-disable-next-line import/order
import fetchMock from 'fetch-mock';

const osddExample = require('./data/OSDD_example.xml');
const atomExample = require('./data/atom_example.xml');

const osddExampleNoSuggestions = `<?xml version="1.0" encoding="UTF-8"?>
<OpenSearchDescription xmlns="http://a9.com/-/spec/opensearch/1.1/">
  <ShortName>Web Search</ShortName>
  <Description>Use Example.com to search the Web.</Description>
  <Tags>example web</Tags>
  <Contact>admin@example.com</Contact>
  <Url type="application/atom+xml"
       template="http://example.com/?q={searchTerms}&amp;pw={startPage?}&amp;format=atom"/>
  <Url type="application/rss+xml"
       template="http://example.com/?q={searchTerms}&amp;pw={startPage?}&amp;format=rss"/>
  <Url type="text/html"
       template="http://example.com/?q={searchTerms}&amp;pw={startPage?}"/>
  <LongName>Example.com Web Search</LongName>
  <Image height="64" width="64" type="image/png">http://example.com/websearch.png</Image>
  <Image height="16" width="16" type="image/vnd.microsoft.icon">http://example.com/websearch.ico</Image>
  <Query role="example" searchTerms="cat" />
  <Developer>Example.com Development Team</Developer>
  <Attribution>
    Search data Copyright 2005, Example.com, Inc., All Rights Reserved
  </Attribution>
  <SyndicationRight>open</SyndicationRight>
  <AdultContent>false</AdultContent>
  <Language>en-us</Language>
  <OutputEncoding>UTF-8</OutputEncoding>
  <InputEncoding>UTF-8</InputEncoding>
</OpenSearchDescription>
`;

const suggestionsJSON = `
["sea",
 ["sears",
  "search engines",
  "search engine",
  "search",
  "sears.com",
  "seattle times"],
 ["7,390,000 results",
  "17,900,000 results",
  "25,700,000 results",
  "1,220,000,000 results",
  "1 result",
  "17,600,000 results"],
 ["http://example.com?q=sears",
  "http://example.com?q=search+engines",
  "http://example.com?q=search+engine",
  "http://example.com?q=search",
  "http://example.com?q=sears.com",
  "http://example.com?q=seattle+times"]]
`;

describe('OpenSearchService', () => {
  before(() => {
    fetchMock
      .mock('begin:http://example.com/?q=', atomExample)
      .mock('begin:http://example.com/suggestions/?q=', suggestionsJSON)
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

  describe('#getSuggestions()', () => {
    const service = OpenSearchService.fromXml(osddExample);
    const serviceNoSuggestions = OpenSearchService.fromXml(osddExampleNoSuggestions);
    it('shall get the correct suggestions', () => (
      service.getSuggestions({ searchTerms: 'sea' })
        .then((suggestions) => {
          expect(suggestions).to.have.lengthOf(6);
        })
    ));

    it('shall get the fail as expected when no suggestion URL is available', () => (
      serviceNoSuggestions.getSuggestions({ searchTerms: 'sea' })
        .then(() => { throw new Error('Expected method to reject.'); })
        .catch((error) => {
          expect(error).to.exist;
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
