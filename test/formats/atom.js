import { expect } from 'chai';

import { AtomFormat } from '../../src/formats/atom.js';

const atomExample = require('../data/atom_example.xml');
const xmlGeoBox = require('../data/atom_example_box.xml');
const atomGmlPoint = require('../data/atom_gml_point.xml');
const atomGmlLineString = require('../data/atom_gml_linestring.xml');
const atomGmlPolygon = require('../data/atom_gml_polygon.xml');
const atomGmlMultiSurface = require('../data/atom_gml_multisurface.xml');

describe('AtomFormat', () => {
  const format = new AtomFormat();
  describe('parse', () => {
    it('should parse the entries of a simple example', () => {
      return format.parse(new Response(atomExample)).then(result => {
        expect(result).to.deep.equal({
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
              content: `
      ... Harlem.NYC - A virtual tour and information on
      businesses ...  with historic photos of Columbia's own New York
      neighborhood ... Internet Resources for the City's History. ...
    `,
            },
          }],
        });
      });
    });

    it('should parse the entries of a geo example', () => {
      return format.parse(new Response(xmlGeoBox)).then(result => {
        expect(result).to.deep.equal({
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
              content: '',
              links: [{
                href: 'http://ows.eox.at/testbed-12/eoxserver/ows?service=WCS&version=2.0.1&request=GetCoverage&coverageId=dlr_fire_emission_dispersion_california_20160223_1',
                rel: 'enclosure',
              }, {
                href: 'http://ows.eox.at/testbed-12/eoxserver/ows?service=WCS&version=2.0.1&request=DescribeCoverage&coverageId=dlr_fire_emission_dispersion_california_20160223_1',
                rel: 'via',
              }],
            },
            bbox: [-135.0, 0.0, -90.0, 45.0],
          }],
        });
      });
    });

    it('should parse the entries of a gml point example', () => {
      return format.parse(new Response(atomGmlPoint)).then(result => {
        expect(result).to.deep.equal({
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
              content: '',
              links: [{
                href: 'http://example.org/2005/09/09/atom01',
              }],
            },
            geometry: {
              type: 'Point',
              coordinates: [-71.92, 45.256],
            },
          }],
        });
      });
    });

    it('should parse the entries of a gml linestring example', () => {
      return format.parse(new Response(atomGmlLineString)).then(result => {
        expect(result).to.deep.equal({
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
              content: '',
              links: [{
                href: 'http://example.org/2005/09/09/atom01',
              }],
            },
            geometry: {
              type: 'LineString',
              coordinates: [[-110.45, 45.256], [-109.48, 46.46], [-109.86, 43.84]],
            },
          }],
        });
      });
    });

    it('should parse the entries of a gml polygon example', () => {
      return format.parse(new Response(atomGmlPolygon)).then(result => {
        expect(result).to.deep.equal({
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
              content: '',
              links: [{
                href: 'http://example.org/2005/09/09/atom01',
              }],
            },
            geometry: {
              type: 'Polygon',
              coordinates: [[[-110.45, 45.256], [-109.48, 46.46], [-109.86, 43.84], [-110.45, 45.256]]],
            },
          }],
        });
      });
    });

    it('should parse the entries of a gml multisurface example', () => {
      return format.parse(new Response(atomGmlMultiSurface)).then(result => {
        expect(result).to.deep.equal({
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
              content: '',
              links: [{
                href: 'http://example.org/2005/09/09/atom01',
              }],
            },
            geometry: {
              type: 'MultiPolygon',
              coordinates: [
                [[[-110.45, 45.256], [-109.48, 46.46], [-109.86, 43.84], [-110.45, 45.256]]],
                [[[-110.45, 45.256], [-109.48, 46.46], [-109.86, 43.84], [-110.45, 45.256]]],
              ],
            },
          }],
        });
      });
    });
  });
});
