import { expect } from 'chai';

import { RSSFormat } from '../../src/formats/rss';

const rssSimple = require('../data/rss_simple.xml');
const rssBox = require('../data/rss_geo_box.xml');

describe('RSSFormat', () => {
  const format = new RSSFormat();
  describe('parse', () => {
    it('should parse the entries of a simple example', () => (
      expect(format.parse(rssSimple)).to.deep.equal({
        totalResults: 4230000,
        startIndex: 21,
        itemsPerPage: 10,
        links: [],
        query: {},
        records: [{
          id: null,
          properties: {
            title: 'New York History',
            links: [],
            media: [],
            content: `
        ... Harlem.NYC - A virtual tour and information on
        businesses ...  with historic photos of Columbia's own New York
        neighborhood ... Internet Resources for the City's History. ...
      `,
            summary: `
        ... Harlem.NYC - A virtual tour and information on
        businesses ...  with historic photos of Columbia's own New York
        neighborhood ... Internet Resources for the City's History. ...
      `,
          },
        }],
      })
    ));

    it('should parse the entries of a geo example', () => (
      expect(format.parse(rssBox)).to.deep.equal({
        totalResults: 32,
        startIndex: 0,
        itemsPerPage: 1,
        links: [],
        query: {},
        records: [{
          id: 'http://ows.eox.at/testbed-12_staging/eoxserver/opensearch/collections/dlr_fire_emission_dispersion_california_20160223/rss/?q=&count=1&startIndex=&bbox=&geom=&lon=&lat=&r=&georel=&uid=&start=&timerel=',
          properties: {
            title: 'dlr_fire_emission_dispersion_california_20160223_1',
            content: null,
            time: new Date('2016-02-23T03:00:00.000Z'),
            links: [{
              href: 'http://ows.eox.at/testbed-12_staging/eoxserver/ows?service=WCS&version=2.0.1&request=GetCoverage&coverageId=dlr_fire_emission_dispersion_california_20160223_1',
              rel: 'enclosure',
            }, {
              href: 'http://ows.eox.at/testbed-12_staging/eoxserver/ows?service=WCS&version=2.0.1&request=DescribeCoverage&coverageId=dlr_fire_emission_dispersion_california_20160223_1',
              rel: 'via',
            }],
            media: [],
            summary: null,
          },
          bbox: [-135.0, 0.0, -90.0, 45.0],
        }],
      })
    ));
  });
});
