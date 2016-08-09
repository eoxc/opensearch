import { expect } from 'chai';

import { AtomFormat } from '../../../src/formats/atom.js';

const xmlSimple = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom"
      xmlns:opensearch="http://a9.com/-/spec/opensearch/1.1/">
  <title>Example.com Search: New York history</title>
  <link href="http://example.com/New+York+history"/>
  <updated>2003-12-13T18:30:02Z</updated>
  <author>
    <name>Example.com, Inc.</name>
  </author>
  <id>urn:uuid:60a76c80-d399-11d9-b93C-0003939e0af6</id>
  <opensearch:totalResults>4230000</opensearch:totalResults>
  <opensearch:startIndex>21</opensearch:startIndex>
  <opensearch:itemsPerPage>10</opensearch:itemsPerPage>
  <opensearch:Query role="request" searchTerms="New York History" startPage="1" />
  <link rel="alternate" href="http://example.com/New+York+History?pw=3" type="text/html"/>
  <link rel="self" href="http://example.com/New+York+History?pw=3&amp;format=atom" type="application/atom+xml"/>
  <link rel="first" href="http://example.com/New+York+History?pw=1&amp;format=atom" type="application/atom+xml"/>
  <link rel="previous" href="http://example.com/New+York+History?pw=2&amp;format=atom" type="application/atom+xml"/>
  <link rel="next" href="http://example.com/New+York+History?pw=4&amp;format=atom" type="application/atom+xml"/>
  <link rel="last" href="http://example.com/New+York+History?pw=42299&amp;format=atom" type="application/atom+xml"/>
  <link rel="search" type="application/opensearchdescription+xml" href="http://example.com/opensearchdescription.xml"/>
  <entry>
    <title>New York History</title>
    <link href="http://www.columbia.edu/cu/lweb/eguids/amerihist/nyc.html"/>
    <id>urn:uuid:1225c695-cfb8-4ebb-aaaa-80da344efa6a</id>
    <updated>2003-12-13T18:30:02Z</updated>
    <content type="text">
      ... Harlem.NYC - A virtual tour and information on
      businesses ...  with historic photos of Columbia's own New York
      neighborhood ... Internet Resources for the City's History. ...
    </content>
  </entry>
</feed>`;

const xmlGeo = `<feed xmlns:georss="http://www.georss.org/georss" xmlns:geo="http://a9.com/-/opensearch/extensions/geo/1.0/" xmlns:opensearch="http://a9.com/-/spec/opensearch/1.1/" xmlns:time="http://a9.com/-/opensearch/extensions/time/1.0/" xmlns="http://www.w3.org/2005/Atom">
  <id>http://ows.eox.at/testbed-12/eoxserver/opensearch/collections/dlr_fire_emission_dispersion_california_20160223/atom/</id>
  <title>dlr_fire_emission_dispersion_california_20160223 Search</title>
  <link href="http://ows.eox.at/testbed-12/eoxserver/opensearch/collections/dlr_fire_emission_dispersion_california_20160223/atom/" rel="self"/>
  <description/>
  <opensearch:totalResults>32</opensearch:totalResults>
  <opensearch:startIndex>0</opensearch:startIndex>
  <opensearch:itemsPerPage>32</opensearch:itemsPerPage>
  <opensearch:Query role="request"/>
  <link href="http://ows.eox.at/testbed-12/eoxserver/opensearch/" type="application/opensearchdescription+xml" rel="search"/>
  <link href="http://ows.eox.at/testbed-12/eoxserver/opensearch/collections/dlr_fire_emission_dispersion_california_20160223/atom/" type="application/atom+xml" rel="self"/>
  <link href="http://ows.eox.at/testbed-12/eoxserver/opensearch/collections/dlr_fire_emission_dispersion_california_20160223/atom/?" type="application/atom+xml" rel="first"/>
  <link href="http://ows.eox.at/testbed-12/eoxserver/opensearch/collections/dlr_fire_emission_dispersion_california_20160223/atom/?startIndex=32" type="application/atom+xml" rel="last"/>
  <entry>
    <title>dlr_fire_emission_dispersion_california_20160223_1</title>
    <id>dlr_fire_emission_dispersion_california_20160223_1</id>
    <link href="http://ows.eox.at/testbed-12/eoxserver/ows?service=WCS&amp;version=2.0.1&amp;request=GetCoverage&amp;coverageId=dlr_fire_emission_dispersion_california_20160223_1" rel="enclosure"/>
    <link href="http://ows.eox.at/testbed-12/eoxserver/ows?service=WCS&amp;version=2.0.1&amp;request=DescribeCoverage&amp;coverageId=dlr_fire_emission_dispersion_california_20160223_1" rel="via"/>
    <updated>2003-12-13T18:30:02Z</updated>
    <georss:box>0.000000 -135.000000 45.000000 -90.000000</georss:box>
  </entry>
</feed>`;

describe('AtomFormat', () => {
  const format = new AtomFormat();
  describe('parse', () => {
    it('should parse the entries of a simple example', () => {
      expect(format.parse(xmlSimple)).to.deep.equal([{
        id: 'urn:uuid:1225c695-cfb8-4ebb-aaaa-80da344efa6a',
        properties: {
          title: 'New York History',
          updated: new Date('2003-12-13T18:30:02Z'),
          content: `
      ... Harlem.NYC - A virtual tour and information on
      businesses ...  with historic photos of Columbia's own New York
      neighborhood ... Internet Resources for the City's History. ...
    `,
        },
      }]);
    });

    it('should parse the entries of a geo example', () => {
      expect(format.parse(xmlGeo)).to.deep.equal([{
        id: 'dlr_fire_emission_dispersion_california_20160223_1',
        properties: {
          title: 'dlr_fire_emission_dispersion_california_20160223_1',
          updated: new Date('2003-12-13T18:30:02Z'),
          content: '',
        },
        bbox: [-135.0, 0.0, -90.0, 45.0],
      }]);
    });
  });
});
