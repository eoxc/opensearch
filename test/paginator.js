/* eslint-disable no-unused-expressions  */
import { expect } from 'chai';
import sinon from 'sinon';
// import searchModule from '../src/search';
import { OpenSearchPaginator } from '../src/paginator';
import { OpenSearchParameter } from '../src/parameter';
import { OpenSearchUrl } from '../src/url';

const searchModule = require('../src/search');

describe('OpenSearchPaginator', () => {
  const simpleUrl = OpenSearchUrl.fromTemplateUrl(
    'application/atom+xml', 'http://example.com/?start={startIndex?}&count={count?}'
  );
  const urlWithCountMax = new OpenSearchUrl(
    'application/atom+xml', 'http://example.com/', [
      new OpenSearchParameter('count', 'count', false, null, undefined, undefined, 1, 25),
      new OpenSearchParameter('start', 'startIndex'),
    ], 'application/x-www-form-urlencoded', 0, 0
  );

  let searchStub;

  beforeEach(() => {
    searchStub = sinon.stub(searchModule, 'search');
    searchStub.withArgs(simpleUrl, sinon.match({ startIndex: 1 })).returns(Promise.resolve({
      totalResults: 51,
      startIndex: 1,
      itemsPerPage: 25,
      records: [],
    }));
    searchStub.withArgs(simpleUrl, sinon.match({ startIndex: 26 })).returns(Promise.resolve({
      totalResults: 51,
      startIndex: 26,
      itemsPerPage: 25,
      records: [],
    }));

    searchStub.withArgs(urlWithCountMax, sinon.match({ startIndex: 0 })).returns(Promise.resolve({
      totalResults: 51,
      startIndex: 0,
      itemsPerPage: 30,
      records: [],
    }));
  });

  afterEach(() => {
    searchStub.restore();
  });

  describe('getActualPageSize()', () => {
    it('shall report undefined when not page size is unknown', () => {
      const paginator = new OpenSearchPaginator(simpleUrl, {});
      expect(paginator.getActualPageSize()).to.be.undefined;
    });

    it('shall report the correct page size when first page is returned', () => {
      const paginator = new OpenSearchPaginator(simpleUrl, {});
      return paginator.fetchPage()
        .then(() => {
          expect(searchStub.called).to.be.ok;
          expect(paginator.getActualPageSize()).to.equal(25);
        });
    });

    it('shall report the page size from the description, when available', () => {
      const paginator = new OpenSearchPaginator(urlWithCountMax, {});
      expect(paginator.getActualPageSize()).to.equal(25);
    });

    it('shall report the corrected page size when first page is returned', () => {
      const paginator = new OpenSearchPaginator(urlWithCountMax, {});
      return paginator.fetchPage()
        .then(() => {
          expect(searchStub.called).to.be.ok;
          expect(paginator.getActualPageSize()).to.equal(30); // actualized page size from result
        });
    });
  });

  describe('fetchPage()', () => {

  });
});
