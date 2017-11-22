import { expect } from 'chai';

import { SuggestionsJSONFormat } from '../../src/formats/suggestions-json';

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

const suggestionsJSONonlyComplection = `
["sea",
 ["sears",
  "search engines",
  "search engine",
  "search",
  "sears.com",
  "seattle times"]]`;

describe('SuggestionsJSONFormat', () => {
  const format = new SuggestionsJSONFormat();
  describe('parse', () => {
    it('should parse the suggestions from the passed JSON', () => {
      expect(format.parse(suggestionsJSON)).to.deep.equal([{
        completion: 'sears',
        description: '7,390,000 results',
        url: 'http://example.com?q=sears',
      }, {
        completion: 'search engines',
        description: '17,900,000 results',
        url: 'http://example.com?q=search+engines',
      }, {
        completion: 'search engine',
        description: '25,700,000 results',
        url: 'http://example.com?q=search+engine',
      }, {
        completion: 'search',
        description: '1,220,000,000 results',
        url: 'http://example.com?q=search',
      }, {
        completion: 'sears.com',
        description: '1 result',
        url: 'http://example.com?q=sears.com',
      }, {
        completion: 'seattle times',
        description: '17,600,000 results',
        url: 'http://example.com?q=seattle+times',
      }]);
    });
    it('should parse the suggestions from the passed JSON with only the completion', () => {
      expect(format.parse(suggestionsJSONonlyComplection)).to.deep.equal([{
        completion: 'sears',
        description: undefined,
        url: undefined,
      }, {
        completion: 'search engines',
        description: undefined,
        url: undefined,
      }, {
        completion: 'search engine',
        description: undefined,
        url: undefined,
      }, {
        completion: 'search',
        description: undefined,
        url: undefined,
      }, {
        completion: 'sears.com',
        description: undefined,
        url: undefined,
      }, {
        completion: 'seattle times',
        description: undefined,
        url: undefined,
      }]);
    });
  });
});
