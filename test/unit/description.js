import { expect } from 'chai';

import { OpenSearchDescription } from '../../src/description.js';

const xml = `<?xml version="1.0" encoding="UTF-8"?>
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
 </OpenSearchDescription>`;


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
      const url = description.getUrl('text/html');
      expect(url.type).to.equal('text/html');
      expect(url.method).to.equal('GET');
    });
  });
});
