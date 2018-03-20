/* eslint-disable no-unused-expressions */
/* eslint-disable no-useless-escape */

import { expect } from 'chai';
import { OpenSearchParameter } from '../src/parameter';
import { parseXml } from '../src/utils';

const namespace = 'xmlns:parameters="http://a9.com/-/spec/opensearch/extensions/parameters/1.0/"';

describe('OpenSearchParameter', () => {
  describe('combined', () => {
    // TODO: do tests
  });

  describe('serializeValue', () => {
    const paramTime = OpenSearchParameter.fromKeyValuePair('start', '{time:start}');
    const paramBox = OpenSearchParameter.fromKeyValuePair('box', '{geo:box}');
    const paramGeometry = OpenSearchParameter.fromKeyValuePair('geometry', '{geo:geometry}');
    const paramEONumeric = OpenSearchParameter.fromKeyValuePair('orbitNumber', '{eo:orbitNumber}');
    const paramEODate = OpenSearchParameter.fromKeyValuePair('creationDate', '{eo:creationDate}');
    const paramMultiTemplateOptional = OpenSearchParameter.fromKeyValuePair('timespan', '{time:start?}/{time:end?}');

    const paramDateWithPatternNoMS = OpenSearchParameter.fromNode(
      parseXml(
        `<parameters:Parameter name="start" value="{time:start}" ${namespace} pattern="^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(Z|[\+\-][0-9]{2}:([0-9]{2})?)$" />`
      ).documentElement
    );

    const paramDateWithPatternNoTZ = OpenSearchParameter.fromNode(
      parseXml(
        `<parameters:Parameter name="start" value="{time:start}" ${namespace} pattern="^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\.[0-9]{3}$" />`
      ).documentElement
    );

    const paramDateWithPatternNoMSandTZ = OpenSearchParameter.fromNode(
      parseXml(
        `<parameters:Parameter name="start" value="{time:start}" ${namespace} pattern="^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}$" />`
      ).documentElement
    );

    const paramDateWithUnknownPattern = OpenSearchParameter.fromNode(
      parseXml(
        `<parameters:Parameter name="start" value="{time:start}" ${namespace} pattern="^unknown$" />`
      ).documentElement
    );

    it('shall correctly encode Dates', () => {
      expect(paramTime.serializeValue(new Date('2000-01-01T01:01:01Z'))).to.equal('2000-01-01T01:01:01.000Z');
    });

    it('shall correctly encode bounding box values', () => {
      expect(paramBox.serializeValue([0, 0, 1, 1])).to.equal('0,0,1,1');
    });

    it('shall correctly encode point geometry values', () => {
      expect(paramGeometry.serializeValue({ type: 'Point', coordinates: [0, 0] })).to.match(/^POINT/);
    });
    it('shall correctly encode linestring geometry values', () => {
      expect(paramGeometry.serializeValue({ type: 'LineString', coordinates: [[0, 0], [1, 1]] })).to.match(/^LINESTRING/);
    });
    it('shall correctly encode polygon geometry values', () => {
      expect(paramGeometry.serializeValue({ type: 'Polygon', coordinates: [[[0, 0], [1, 0], [0, 1], [0, 0]]] })).to.match(/^POLYGON/);
    });
    it('shall correctly encode multipolygon geometry values', () => {
      expect(paramGeometry.serializeValue({ type: 'MultiPolygon', coordinates: [[[[0, 0], [1, 0], [0, 1], [0, 0]]]] })).to.match(/^MULTIPOLYGON/);
    });

    it('shall correctly encode simple numeric EO values', () => {
      expect(paramEONumeric.serializeValue(10.1)).to.equal('10.1');
    });
    it('shall correctly encode lists of numeric EO values', () => {
      expect(paramEONumeric.serializeValue([1, 2, 3])).to.equal('{1,2,3}');
    });
    it('shall correctly encode inclusive intervals', () => {
      expect(paramEONumeric.serializeValue({ min: 1, max: 2 })).to.equal('[1,2]');
    });
    it('shall correctly encode exclusive intervals', () => {
      expect(paramEONumeric.serializeValue({ minExclusive: 1, maxExclusive: 2 })).to.equal(']1,2[');
    });
    it('shall correctly encode top open intervals', () => {
      expect(paramEONumeric.serializeValue({ min: 1 })).to.equal('[1');
    });
    it('shall correctly encode bottom open intervals', () => {
      expect(paramEONumeric.serializeValue({ maxExclusive: 2 })).to.equal('2[');
    });

    it('shall correctly encode simple numeric EO dates', () => {
      expect(paramEODate.serializeValue(new Date('2000-01-01T01:01:01Z'))).to.equal('2000-01-01T01:01:01.000Z');
    });
    it('shall correctly encode lists of numeric EO date', () => {
      expect(paramEODate.serializeValue([new Date('2000-01-01T01:01:01Z'), new Date('2000-01-02T01:01:01Z'), new Date('2000-01-03T01:01:01Z')]))
        .to.equal('{2000-01-01T01:01:01.000Z,2000-01-02T01:01:01.000Z,2000-01-03T01:01:01.000Z}');
    });
    it('shall correctly encode inclusive date intervals', () => {
      expect(paramEODate.serializeValue({ min: new Date('2000-01-01T01:01:01Z'), max: new Date('2000-01-02T01:01:01Z') }))
        .to.equal('[2000-01-01T01:01:01.000Z,2000-01-02T01:01:01.000Z]');
    });
    it('shall correctly encode exclusive date intervals', () => {
      expect(paramEODate.serializeValue({ minExclusive: new Date('2000-01-01T01:01:01Z'), maxExclusive: new Date('2000-01-02T01:01:01Z') }))
        .to.equal(']2000-01-01T01:01:01.000Z,2000-01-02T01:01:01.000Z[');
    });
    it('shall correctly encode top open date intervals', () => {
      expect(paramEODate.serializeValue({ min: new Date('2000-01-01T01:01:01Z') })).to.equal('[2000-01-01T01:01:01.000Z');
    });
    it('shall correctly encode bottom open date intervals', () => {
      expect(paramEODate.serializeValue({ maxExclusive: new Date('2000-01-02T01:01:01Z') })).to.equal('2000-01-02T01:01:01.000Z[');
    });

    it('shall correctly serialize dates when a pattern is specified', () => {
      expect(paramDateWithPatternNoMS.serializeValue(new Date('2000-01-02T01:01:01Z'))).to.equal('2000-01-02T01:01:01Z');
    });
    it('shall correctly serialize dates when a pattern is specified', () => {
      expect(paramDateWithPatternNoTZ.serializeValue(new Date('2000-01-02T01:01:01Z'))).to.equal('2000-01-02T01:01:01.000');
    });
    it('shall correctly serialize dates when a pattern is specified', () => {
      expect(paramDateWithPatternNoMSandTZ.serializeValue(new Date('2000-01-02T01:01:01Z'))).to.equal('2000-01-02T01:01:01');
    });
    it('shall throw when no pattern could be decoded', () => {
      expect(paramDateWithUnknownPattern.serializeValue(new Date('2000-01-02T01:01:01Z'))).to.equal('2000-01-02T01:01:01.000Z');
    });

    it('shall work with multi params and templates', () => {
      expect(paramMultiTemplateOptional.serializeValue(new Date('2000-01-02T01:01:01Z'), 'time:start')).to.equal('2000-01-02T01:01:01.000Z');
      expect(paramMultiTemplateOptional.serializeValue(new Date('2000-01-03T01:01:01Z'), 'time:end')).to.equal('2000-01-03T01:01:01.000Z');
    });
  });

  describe('fromKeyValuePair', () => {
    const paramMandatory = OpenSearchParameter.fromKeyValuePair('q', '{searchTerms}');
    const paramOptional = OpenSearchParameter.fromKeyValuePair('start', '{startIndex?}');
    const paramIgnored = OpenSearchParameter.fromKeyValuePair('format', 'rss');
    const paramMultiTemplateOptional = OpenSearchParameter.fromKeyValuePair('timespan', '{time:start?}/{time:end?}');

    it('should work for mandatory parameters', () => {
      expect(paramMandatory.name).to.equal('q');
      expect(paramMandatory.type).to.equal('searchTerms');
      expect(paramMandatory.mandatory).to.be.true;
    });

    it('should work for optional parameters', () => {
      expect(paramOptional.name).to.equal('start');
      expect(paramOptional.type).to.equal('startIndex');
      expect(paramOptional.mandatory).to.be.false;
    });

    it('should ignore parameters when the value is not right', () => {
      expect(paramIgnored).to.be.null;
    });

    it('should work with templates and multiple values at once', () => {
      expect(paramMultiTemplateOptional.name).to.equal('timespan');
      expect(paramMultiTemplateOptional.type).to.deep.equal(['time:start', 'time:end']);
      expect(paramMultiTemplateOptional.mandatory).to.be.false;
    });
  });

  describe('fromNode', () => {
    const paramMandatory = OpenSearchParameter.fromNode(
      parseXml(`<parameters:Parameter name="q" value="{searchTerms}" ${namespace}/>`).documentElement
    );
    const paramOptional = OpenSearchParameter.fromNode(
      parseXml(`<parameters:Parameter name="count" value="{itemsPerPage}" minimum="0" ${namespace}/>`).documentElement
    );

    const paramWithOptions = OpenSearchParameter.fromNode(
      parseXml(
        `<parameters:Parameter name="count" value="{itemsPerPage}" minimum="0" ${namespace}>
          <parameters:Option label="10" value="10" />
          <parameters:Option label="20" value="20" />
        </parameters:Parameter>`
      ).documentElement
    );
    const paramLimitsInclusive = OpenSearchParameter.fromNode(
      parseXml(
        `<parameters:Parameter name="count" value="{itemsPerPage}" minimum="0" ${namespace} minInclusive="0" maxInclusive="50" />`
      ).documentElement
    );
    const paramLimitsExclusive = OpenSearchParameter.fromNode(
      parseXml(
        `<parameters:Parameter name="count" value="{itemsPerPage}" minimum="0" ${namespace} minExclusive="0" maxExclusive="50" />`
      ).documentElement
    );

    it('should work for potentially mandatory parameters', () => {
      expect(paramMandatory.name).to.equal('q');
      expect(paramMandatory.type).to.equal('searchTerms');
      expect(paramMandatory.mandatory).to.be.undefined;
    });

    it('should work for optional parameters', () => {
      expect(paramOptional.name).to.equal('count');
      expect(paramOptional.type).to.equal('itemsPerPage');
      expect(paramOptional.mandatory).to.be.false;
    });

    it('should parse options', () => {
      expect(paramWithOptions.options).to.deep.equal([
        { label: '10', value: '10' },
        { label: '20', value: '20' },
      ]);
    });

    it('should work with inclusive limits', () => {
      expect(paramLimitsInclusive.name).to.equal('count');
      expect(paramLimitsInclusive.type).to.equal('itemsPerPage');
      expect(paramLimitsInclusive.minInclusive).to.equal(0);
      expect(paramLimitsInclusive.maxInclusive).to.equal(50);
    });

    it('should work with exclusive limits', () => {
      expect(paramLimitsExclusive.name).to.equal('count');
      expect(paramLimitsExclusive.type).to.equal('itemsPerPage');
      expect(paramLimitsExclusive.minExclusive).to.equal(0);
      expect(paramLimitsExclusive.maxExclusive).to.equal(50);
    });
  });
});
