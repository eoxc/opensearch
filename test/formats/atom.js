import { expect } from 'chai';

import { AtomFormat } from '../../src/formats/atom.js';

const atomExample = require('../data/atom_example.xml');
const xmlGeoBox = require('../data/atom_example_box.xml');
const atomGmlPoint = require('../data/atom_gml_point.xml');
const atomGmlLineString = require('../data/atom_gml_linestring.xml');
const atomGmlPolygon = require('../data/atom_gml_polygon.xml');


describe('AtomFormat', () => {
  const format = new AtomFormat();
  describe('parse', () => {
    it('should parse the entries of a simple example', () => {
      return format.parse(new Response(atomExample)).then(result => {
        expect(result).to.deep.equal([{
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

    });

    it('should parse the entries of a geo example', () => {
      return format.parse(new Response(xmlGeoBox)).then(result => {
        expect(result).to.deep.equal([{
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

    it('should parse the entries of a gml point example', () => {
      return format.parse(new Response(atomGmlPoint)).then(result => {
        expect(result).to.deep.equal([{
          id: 'urn:uuid:1225c695-cfb8-4ebb-aaaa-80da344efa6a',
          properties: {
            title: 'M 3.2, Mona Passage',
            updated: new Date('2005-08-17T07:02:32Z'),
            content: '',
          },
          geometry: {
            type: 'Point',
            coordinates: [-71.92, 45.256],
          },
        }]);
      });
    });

    it('should parse the entries of a gml linestring example', () => {
      return format.parse(new Response(atomGmlLineString)).then(result => {
        expect(result).to.deep.equal([{
          id: 'urn:uuid:1225c695-cfb8-4ebb-aaaa-80da344efa6a',
          properties: {
            title: 'M 3.2, Mona Passage',
            updated: new Date('2005-08-17T07:02:32Z'),
            content: '',
          },
          geometry: {
            type: 'LineString',
            coordinates: [[-110.45, 45.256], [-109.48, 46.46], [-109.86, 43.84]],
          },
        }]);
      });
    });

    it('should parse the entries of a gml polygon example', () => {
      return format.parse(new Response(atomGmlPolygon)).then(result => {
        expect(result).to.deep.equal([{
          id: 'urn:uuid:1225c695-cfb8-4ebb-aaaa-80da344efa6a',
          properties: {
            title: 'M 3.2, Mona Passage',
            updated: new Date('2005-08-17T07:02:32Z'),
            content: '',
          },
          geometry: {
            type: 'Polygon',
            coordinates: [[[-110.45, 45.256], [-109.48, 46.46], [-109.86, 43.84], [-110.45, 45.256]]],
          },
        }]);
      });
    });
  });
});
