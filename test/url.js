import { expect } from 'chai';
import { OpenSearchUrl } from '../src/url';
import { OpenSearchParameter } from '../src/parameter';
import { parseXml } from '../src/utils';

describe('OpenSearchUrl', () => {
  describe('fromTemplateUrl', () => {
    const url = OpenSearchUrl.fromTemplateUrl(
      'application/atom+xml',
      'http://example.com/?q={searchTerms}&start={startIndex?}&format=rss'
    );

    it('should have the correct type', () => {
      expect(url.type).to.equal('application/atom+xml');
    });

    it('should have the correct parameters', () => {
      expect(url.parameters).to.deep.equal([
        new OpenSearchParameter('searchTerms', 'q', true),
        new OpenSearchParameter('startIndex', 'start', false),
      ]);
    });
  });

  describe('fromNode', () => {
    const xml = `<Url xmlns:parameters="http://a9.com/-/spec/opensearch/extensions/parameters/1.0/"
      type="text/html"
      template="http://example.com/search"
      parameters:method="POST"
      parameters:enctype="application/x-www-form-urlencoded">
   <parameters:Parameter name="q" value="{searchTerms}"/>
   <parameters:Parameter name="count" value="{itemsPerPage}" minimum="0"/>
   <parameters:Parameter name="start" value="{startIndex}" minimum="0"/>
 </Url>
    `;

    const url = OpenSearchUrl.fromNode(parseXml(xml).documentElement);

    it('should have the correct type', () => {
      expect(url.type).to.equal('text/html');
    });

    it('should have the correct method', () => {
      expect(url.method).to.equal('POST');
    });

    it('should have the correct enctype', () => {
      expect(url.enctype).to.equal('application/x-www-form-urlencoded');
    });

    it('should have the correct parameters', () => {
      expect(url.parameters).to.deep.equal([
        new OpenSearchParameter('searchTerms', 'q', true),
        new OpenSearchParameter('itemsPerPage', 'count', false),
        new OpenSearchParameter('startIndex', 'start', false),
      ]);
    });
  });


  describe('serializeValues', () => {
    const xml = `<os:Url
      type="application/atom+xml"
      template="http://demo.pycsw.org/cite/csw?mode=opensearch&amp;service=CSW&amp;version=3.0.0&amp;request=GetRecords&amp;elementsetname=full&amp;typenames=csw:Record&amp;resulttype=results&amp;q={searchTerms?}&amp;bbox={geo:box?}&amp;time={time:start?}/{time:end?}&amp;outputformat=application/atom+xml&amp;&amp;startposition={startIndex?}&amp;maxrecords={count?}&amp;recordids={geo:uid}"/>`;
    const url = OpenSearchUrl.fromNode(parseXml(xml).documentElement);

    it('shall serialize values', () => {
      const serialized = url.serializeValues({
        searchTerms: 'terms',
        'geo:box': [0, 0, 1, 1],
        'time:start': new Date('2001-01-01T00:00:00Z'),
        'time:end': new Date('2002-01-01T00:00:00Z'),
        'geo:uid': 'someuid',
        // startIndex and count are intentionally left empty
      });

      expect(serialized).to.deep.equal([
        ['q', 'searchTerms', 'terms'],
        ['bbox', 'geo:box', '0,0,1,1'],
        ['time', 'time:start', '2001-01-01T00:00:00.000Z'],
        ['time', 'time:end', '2002-01-01T00:00:00.000Z'],
        ['startposition', 'startIndex', ''],
        ['maxrecords', 'count', ''],
        ['recordids', 'geo:uid', 'someuid'],
      ]);
    });
  });

  /* TODO: this was moved to a separate file
  describe('#createRequest', () => {
    const urlGet = OpenSearchUrl.fromTemplateUrl(
      'application/atom+xml',
      'http://example.com/?q={searchTerms}&start={startIndex?}&format=rss'
    );

    const xml = `<Url xmlns:parameters="http://a9.com/-/spec/opensearch/extensions/parameters/1.0/"
      type="text/html"
      template="http://example.com/search"
      parameters:method="POST"
      parameters:enctype="application/x-www-form-urlencoded">
   <parameters:Parameter name="q" value="{searchTerms}"/>
   <parameters:Parameter name="count" value="{itemsPerPage}" minimum="0"/>
   <parameters:Parameter name="start" value="{startIndex}" minimum="0"/>
 </Url>
    `;
    const urlPost = OpenSearchUrl.fromNode(parseXml(xml).documentElement);

    const urlGeo = OpenSearchUrl.fromTemplateUrl(
      'application/rss+xml',
      'http://example.com/?q={searchTerms}&pw={startPage?}&bbox={geo:box?}&geom={geo:geometry?}&format=rss'
    );

    const xmlTime = `<Url type="text/html"
       template="http://example.com/?q={searchTerms}&amp;dtstart={time:start?}&amp;dtend={time:end?}&amp;pw={startPage?}"/>`;

    const urlTime = OpenSearchUrl.fromNode(parseXml(xmlTime).documentElement);


    it('should work with referencing parameter name', () => {
      const request = urlGet.createRequest({ q: 'search terms', start: 1 });
      expect(request).to.deep.equal(new Request(
        'http://example.com/?q=search terms&start=1&format=rss'
      ));
    });

    it('should work with referencing parameter type', () => {
      const request = urlGet.createRequest({ searchTerms: 'search terms', startIndex: 1 });
      expect(request).to.deep.equal(new Request(
        'http://example.com/?q=search terms&start=1&format=rss'
      ));
    });

    it('should work with POST and referencing parameter name', () => {
      const request = urlPost.createRequest({ q: 'search terms', start: 1 });
      expect(request).to.deep.equal(new Request(
        'http://example.com/search', {
          body: 'q=search%20terms&start=1',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          method: 'POST',
        }
      ));
    });

    it('should work with POST and referencing parameter type', () => {
      const request = urlPost.createRequest({ searchTerms: 'search terms', startIndex: 1 });
      expect(request).to.deep.equal(new Request(
        'http://example.com/search', {
          body: 'q=search%20terms&start=1',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          method: 'POST',
        }
      ));
    });

    it('should work with Geo parameters', () => {
      const request = urlGeo.createRequest({
        searchTerms: 'search terms',
        pw: 1,
        bbox: [-180, -90, 180, 90],
        'geo:geometry': {
          type: 'LineString',
          coordinates: [
            [102.0, 0.0], [103.0, 1.0], [104.0, 0.0], [105.0, 1.0],
          ],
        },
      });
      expect(request).to.deep.equal(new Request(
        'http://example.com/?q=search terms&pw=1&bbox=-180,-90,180,90&geom=LINESTRING (102 0, 103 1, 104 0, 105 1)&format=rss'
      ));
    });

    it('should work with Time parameters', () => {
      const request = urlTime.createRequest({
        searchTerms: 'search terms',
        dtstart: new Date('1996-12-19T16:39:57-08:00'),
        'time:end': new Date('2007-03-11T02:28:00Z'),
      });
      expect(request).to.deep.equal(new Request(
        'http://example.com/?q=search terms&dtstart=1996-12-20T00:39:57.000Z&dtend=2007-03-11T02:28:00.000Z&pw='
      ));
    });

    it('should fail on invalid parameters', () => {
      expect(() => urlGet.createRequest({ invalid: 123 }))
        .to.throw('Invalid parameter \'invalid\'.');
    });

    it('should fail on missing parameters', () => {
      expect(() => urlGet.createRequest({}))
        .to.throw('Missing mandatory parameters: searchTerms');
    });
  });

  */
});
