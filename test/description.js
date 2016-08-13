import { expect } from 'chai';

import { OpenSearchDescription } from '../src/description.js';

const xml = require('./data/OSDD_example.xml');


describe('OpenSearchDescription', () => {
  describe('constructor', () => {
    const description = new OpenSearchDescription(xml);
    it('should have the correct metadata', () => {
      expect(description.shortName).to.equal('Web Search');
      expect(description.description).to.equal('Use Example.com to search the Web.');
      expect(description.tags).to.equal('example web');
      expect(description.contact).to.equal('admin@example.com');
      expect(description.longName).to.equal('Example.com Web Search');
      expect(description.images).to.deep.equal([
        { width: 64, height: 64, type: 'image/png', url: 'http://example.com/websearch.png' },
        { width: 16, height: 16, type: 'image/vnd.microsoft.icon', url: 'http://example.com/websearch.ico' },
      ]);
      expect(description.queries).to.deep.equal([
        { role: 'example', searchTerms: 'cat' },
      ]);
      expect(description.developer).to.equal('Example.com Development Team');
      expect(description.attribution.trim())
        .to.equal('Search data Copyright 2005, Example.com, Inc., All Rights Reserved');
      expect(description.syndicationRight).to.equal('open');
      expect(description.adultContent).to.equal('false');
      expect(description.language).to.equal('en-us');
      expect(description.outputEncoding).to.equal('UTF-8');
      expect(description.inputEncoding).to.equal('UTF-8');
    });

    it('should have the correct amount of URLs', () => {
      expect(description.urls).to.have.lengthOf(3);
    });
  });

  describe('#getUrl', () => {
    const description = new OpenSearchDescription(xml);
    it('should return the correct URL object', () => {
      const url = description.getUrl({ searchTerms: 'test' }, 'text/html');
      expect(url.type).to.equal('text/html');
      expect(url.method).to.equal('GET');
    });
  });
});
