/* eslint-disable no-unused-expressions */

import { expect } from 'chai';
import { OpenSearchParameter } from '../src/parameter';
import { parseXml } from '../src/utils';

describe('OpenSearchParameter', () => {
  describe('fromKeyValuePair', () => {
    const paramMandatory = OpenSearchParameter.fromKeyValuePair('q', '{searchTerms}');
    const paramOptional = OpenSearchParameter.fromKeyValuePair('start', '{startIndex?}');
    const paramIgnored = OpenSearchParameter.fromKeyValuePair('format', 'rss');

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
  });

  describe('fromNode', () => {
    const namespace = 'xmlns:parameters="http://a9.com/-/spec/opensearch/extensions/parameters/1.0/"';
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
