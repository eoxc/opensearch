import { expect } from 'chai';

import { AtomFormat } from '../../src/formats/atom';

const atomExample = require('../data/atom_example.xml');
const xmlGeoBox = require('../data/atom_example_box.xml');
const atomGmlPoint = require('../data/atom_gml_point.xml');
const atomGmlLineString = require('../data/atom_gml_linestring.xml');
const atomGmlPolygon = require('../data/atom_gml_polygon.xml');
const atomGmlMultiSurface = require('../data/atom_gml_multisurface.xml');
const atomGmlgeometrymember = require('../data/atom_gml_geometrymember.xml');
const atomGmlEnvelope = require('../data/atom_gml_envelope.xml');
const atomEOP = require('../data/atom_eop.xml');
const atomCustom = require('../data/atom_custom.xml');

describe('AtomFormat', () => {
  const format = new AtomFormat();
  describe('parse', () => {
    it('should parse the entries of a simple example', () => (
      expect(format.parse(atomExample)).to.deep.equal({
        totalResults: 4230000,
        startIndex: 21,
        itemsPerPage: 10,
        links: [{
          href: 'http://example.com/New+York+history',
        }, {
          href: 'http://example.com/New+York+History?pw=3',
          rel: 'alternate',
          type: 'text/html',
        }, {
          href: 'http://example.com/New+York+History?pw=3&format=atom',
          rel: 'self',
          type: 'application/atom+xml',
        }, {
          href: 'http://example.com/New+York+History?pw=1&format=atom',
          rel: 'first',
          type: 'application/atom+xml',
        }, {
          href: 'http://example.com/New+York+History?pw=2&format=atom',
          rel: 'previous',
          type: 'application/atom+xml',
        }, {
          href: 'http://example.com/New+York+History?pw=4&format=atom',
          rel: 'next',
          type: 'application/atom+xml',
        }, {
          href: 'http://example.com/New+York+History?pw=42299&format=atom',
          rel: 'last',
          type: 'application/atom+xml',
        }, {
          href: 'http://example.com/opensearchdescription.xml',
          rel: 'search',
          type: 'application/opensearchdescription+xml',
        }],
        query: {},
        records: [{
          id: 'urn:uuid:1225c695-cfb8-4ebb-aaaa-80da344efa6a',
          properties: {
            title: 'New York History',
            updated: new Date('2003-12-13T18:30:02Z'),
            links: [{
              href: 'http://www.columbia.edu/cu/lweb/eguids/amerihist/nyc.html',
            }],
            media: [],
            summary: null,
            content: `
      ... Harlem.NYC - A virtual tour and information on
      businesses ...  with historic photos of Columbia's own New York
      neighborhood ... Internet Resources for the City's History. ...
    `,
          },
        }],
      })
    ));

    it('should parse the entries of a geo example', () => (
      expect(format.parse(xmlGeoBox)).to.deep.equal({
        totalResults: 32,
        startIndex: 0,
        itemsPerPage: 32,
        links: [{
          href: 'http://ows.eox.at/testbed-12/eoxserver/opensearch/collections/dlr_fire_emission_dispersion_california_20160223/atom/',
          rel: 'self',
        }, {
          href: 'http://ows.eox.at/testbed-12/eoxserver/opensearch/',
          rel: 'search',
          type: 'application/opensearchdescription+xml',
        }, {
          href: 'http://ows.eox.at/testbed-12/eoxserver/opensearch/collections/dlr_fire_emission_dispersion_california_20160223/atom/',
          rel: 'self',
          type: 'application/atom+xml',
        }, {
          href: 'http://ows.eox.at/testbed-12/eoxserver/opensearch/collections/dlr_fire_emission_dispersion_california_20160223/atom/?',
          rel: 'first',
          type: 'application/atom+xml',
        }, {
          href: 'http://ows.eox.at/testbed-12/eoxserver/opensearch/collections/dlr_fire_emission_dispersion_california_20160223/atom/?startIndex=32',
          rel: 'last',
          type: 'application/atom+xml',
        }],
        query: {},
        records: [{
          id: 'dlr_fire_emission_dispersion_california_20160223_1',
          properties: {
            title: 'dlr_fire_emission_dispersion_california_20160223_1',
            updated: new Date('2003-12-13T18:30:02Z'),
            content: null,
            links: [{
              href: 'http://ows.eox.at/testbed-12/eoxserver/ows?service=WCS&version=2.0.1&request=GetCoverage&coverageId=dlr_fire_emission_dispersion_california_20160223_1',
              rel: 'enclosure',
            }, {
              href: 'http://ows.eox.at/testbed-12/eoxserver/ows?service=WCS&version=2.0.1&request=DescribeCoverage&coverageId=dlr_fire_emission_dispersion_california_20160223_1',
              rel: 'via',
            }],
            media: [],
            summary: null,
          },
          bbox: [-135.0, 0.0, -90.0, 45.0],
        }],
      })
    ));

    it('should parse the entries of a gml point example', () => (
      expect(format.parse(atomGmlPoint)).to.deep.equal({
        totalResults: NaN,
        startIndex: NaN,
        itemsPerPage: NaN,
        links: [{
          href: 'http://example.org/',
        }],
        query: {},
        records: [{
          id: 'urn:uuid:1225c695-cfb8-4ebb-aaaa-80da344efa6a',
          properties: {
            title: 'M 3.2, Mona Passage',
            updated: new Date('2005-08-17T07:02:32Z'),
            content: null,
            links: [{
              href: 'http://example.org/2005/09/09/atom01',
            }],
            media: [],
            summary: 'We just had a big one.',
          },
          bbox: [
            -71.92,
            45.256,
            -71.92,
            45.256,
          ],
          geometry: {
            type: 'Point',
            coordinates: [-71.92, 45.256],
          },
        }],
      })
    ));

    it('should parse the entries of a gml linestring example', () => (
      expect(format.parse(atomGmlLineString)).to.deep.equal({
        totalResults: NaN,
        startIndex: NaN,
        itemsPerPage: NaN,
        links: [{
          href: 'http://example.org/',
        }],
        query: {},
        records: [{
          id: 'urn:uuid:1225c695-cfb8-4ebb-aaaa-80da344efa6a',
          properties: {
            title: 'M 3.2, Mona Passage',
            updated: new Date('2005-08-17T07:02:32Z'),
            content: null,
            links: [{
              href: 'http://example.org/2005/09/09/atom01',
            }],
            media: [],
            summary: 'We just had a big one.',
          },
          bbox: [
            -110.45,
            43.84,
            -109.48,
            46.46,
          ],
          geometry: {
            type: 'LineString',
            coordinates: [[-110.45, 45.256], [-109.48, 46.46], [-109.86, 43.84]],
          },
        }],
      })
    ));

    it('should parse the entries of a gml polygon example', () => (
      expect(format.parse(atomGmlPolygon)).to.deep.equal({
        totalResults: NaN,
        startIndex: NaN,
        itemsPerPage: NaN,
        links: [{
          href: 'http://example.org/',
        }],
        query: {},
        records: [{
          id: 'urn:uuid:1225c695-cfb8-4ebb-aaaa-80da344efa6a',
          properties: {
            title: 'M 3.2, Mona Passage',
            updated: new Date('2005-08-17T07:02:32Z'),
            content: null,
            links: [{
              href: 'http://example.org/2005/09/09/atom01',
            }],
            media: [],
            summary: 'We just had a big one.',
          },
          bbox: [
            -110.45,
            43.84,
            -109.48,
            46.46,
          ],
          geometry: {
            type: 'Polygon',
            coordinates: [
              [[-110.45, 45.256], [-109.48, 46.46], [-109.86, 43.84], [-110.45, 45.256]],
            ],
          },
        }],
      })
    ));

    it('should parse the entries of a gml envelope example', () => (
      expect(format.parse(atomGmlEnvelope)).to.deep.equal({
        totalResults: NaN,
        startIndex: NaN,
        itemsPerPage: NaN,
        links: [{
          href: 'http://example.org/',
        }],
        query: {},
        records: [{
          id: 'urn:uuid:1225c695-cfb8-4ebb-aaaa-80da344efa6a',
          properties: {
            title: 'M 3.2, Mona Passage',
            updated: new Date('2005-08-17T07:02:32Z'),
            content: null,
            links: [{
              href: 'http://example.org/2005/09/09/atom01',
            }],
            media: [],
            summary: 'We just had a big one.',
          },
          bbox: [
            -71.03,
            42.94,
            -69.86,
            43.04,
          ],
          geometry: {
            type: 'Polygon',
            coordinates: [
              [[-71.03, 42.94], [-69.86, 42.94], [-69.86, 43.04], [-71.03, 43.04], [-71.03, 42.94]],
            ],
          },
        }],
      })
    ));

    it('should parse the entries of a gml multisurface example', () => (
      expect(format.parse(atomGmlMultiSurface)).to.deep.equal({
        totalResults: NaN,
        startIndex: NaN,
        itemsPerPage: NaN,
        links: [{
          href: 'http://example.org/',
        }],
        query: {},
        records: [{
          id: 'urn:uuid:1225c695-cfb8-4ebb-aaaa-80da344efa6a',
          properties: {
            title: 'M 3.2, Mona Passage',
            updated: new Date('2005-08-17T07:02:32Z'),
            content: null,
            links: [{
              href: 'http://example.org/2005/09/09/atom01',
            }],
            media: [],
            summary: 'We just had a big one.',
          },
          bbox: [
            -110.45,
            43.84,
            -109.48,
            46.46,
          ],
          geometry: {
            type: 'MultiPolygon',
            coordinates: [
              [[[-110.45, 45.256], [-109.48, 46.46], [-109.86, 43.84], [-110.45, 45.256]]],
              [[[-110.45, 45.256], [-109.48, 46.46], [-109.86, 43.84], [-110.45, 45.256]]],
            ],
          },
        }],
      })
    ));

    it('should parse the entries of a gml multisurface nested inside a geometrymember example', () => (
      expect(format.parse(atomGmlgeometrymember)).to.deep.equal({
        totalResults: NaN,
        startIndex: NaN,
        itemsPerPage: NaN,
        links: [{
          href: 'http://example.org/',
        }],
        query: {},
        records: [{
          id: 'urn:uuid:1225c695-cfb8-4ebb-aaaa-80da344efa6a',
          properties: {
            title: 'M 3.2, Mona Passage',
            updated: new Date('2005-08-17T07:02:32Z'),
            content: null,
            links: [{
              href: 'http://example.org/2005/09/09/atom01',
            }],
            media: [],
            summary: 'We just had a big one.',
          },
          bbox: [
            -110.45,
            43.84,
            -109.48,
            46.46,
          ],
          geometry: {
            type: 'MultiPolygon',
            coordinates: [
              [[[-110.45, 45.256], [-109.48, 46.46], [-109.86, 43.84], [-110.45, 45.256]]],
              [[[-110.45, 45.256], [-109.48, 46.46], [-109.86, 43.84], [-110.45, 45.256]]],
            ],
          },
        }],
      })
    ));

    it('shall parse the EOP when embedded in the ATOM response', () => {
      expect(format.parse(atomEOP).records[0].properties.eop).to.deep.equal({
        cloudCoverPercentage: '100',
        instrumentShortName: 'MSI',
        orbitNumber: '13045',
        platformSerialIdentifier: '2',
        platformShortName: 'Sentinel',
        processingLevel: '1C',
        productType: 'S2MSI1C',
        resolution: '10m',
        sensorType: 'OPTICAL',
      });
    });

    it('shall parse the s3 bucket path when available', () => {
      expect(format.parse(atomEOP).records[0].properties.s3Path).to.equal('tiles/38/U/PU/2017/12/21/0');
    });

    it('shall parse custom fields when provided in the parsing method', () => {
      const extraFields = {
        'properties.example': 'custom:example/text()',
        'properties.multiExamples': ['custom:multiExample/text()', false],
        'properties.withAttribute': 'custom:withAttribute@attr',
        'properties.withNsAttribute': 'custom:withAttribute@custom:attr2',
        'properties.withAttributes': ['custom:withAttribute@attr', false],
        'properties.withNsAttributes': ['custom:withAttribute@custom:attr2', false],
      };
      const namespaces = {
        custom: 'http://example.com/custom',
      };
      expect(format.parse(atomCustom, { extraFields, namespaces }).records[0]).to.deep.equal({
        id: 'urn:uuid:1225c695-cfb8-4ebb-aaaa-80da344efa6a',
        properties: {
          title: 'New York History',
          updated: new Date('2003-12-13T18:30:02Z'),
          links: [{
            href: 'http://www.columbia.edu/cu/lweb/eguids/amerihist/nyc.html',
          }],
          media: [],
          summary: null,
          content: 'content',
          example: 'This is a test.',
          multiExamples: ['a', 'b'],
          withAttribute: 'test',
          withNsAttribute: 'test2',
          withAttributes: ['test', 'test3'],
          withNsAttributes: ['test2', 'test4'],
        },
      });
    });
  });
});
