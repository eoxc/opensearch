/* eslint-disable no-unused-expressions  */
import { expect } from 'chai';
import sinon from 'sinon';
import { OpenSearchPaginator } from '../src/paginator';
import { OpenSearchParameter } from '../src/parameter';
import { OpenSearchUrl } from '../src/url';

// using `require` on purpose, as with `import` the mocking does not seem to work
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

    searchStub.withArgs(simpleUrl, sinon.match({ startIndex: 1, count: 10 }))
      .returns(Promise.resolve({
        totalResults: 51,
        startIndex: 1,
        itemsPerPage: 10,
        records: (new Array(10)).fill({}),
      }));

    searchStub.withArgs(simpleUrl, sinon.match({ startIndex: 26, count: 15 }))
      .returns(Promise.resolve({
        totalResults: 51,
        startIndex: 26,
        itemsPerPage: 15,
        records: (new Array(15)).fill({}),
      }));

    searchStub.withArgs(simpleUrl, sinon.match({ startIndex: 1 }))
      .returns(Promise.resolve({
        totalResults: 51,
        startIndex: 1,
        itemsPerPage: 25,
        records: (new Array(25)).fill({}),
      }));
    searchStub.withArgs(simpleUrl, sinon.match({ startIndex: 26 }))
      .returns(Promise.resolve({
        totalResults: 51,
        startIndex: 26,
        itemsPerPage: 25,
        records: (new Array(25)).fill({}),
      }));
    searchStub.withArgs(simpleUrl, sinon.match({ startIndex: 51 }))
      .returns(Promise.resolve({
        totalResults: 51,
        startIndex: 51,
        itemsPerPage: 1,
        records: (new Array(1)).fill({}),
      }));

    searchStub.withArgs(urlWithCountMax, sinon.match({ startIndex: 0 }))
      .returns(Promise.resolve({
        totalResults: 51,
        startIndex: 0,
        itemsPerPage: 30,
        records: (new Array(30)).fill({}),
      }));

    searchStub.withArgs(urlWithCountMax, sinon.match({ startIndex: 25, count: 10 }))
      .returns(Promise.resolve({
        totalResults: 51,
        startIndex: 25,
        itemsPerPage: 10,
        records: (new Array(10)).fill({}),
      }));

    searchStub.withArgs(urlWithCountMax, sinon.match({ startIndex: 25 }))
      .returns(Promise.resolve({
        totalResults: 51,
        startIndex: 25,
        itemsPerPage: 25,
        records: (new Array(25)).fill({}),
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
    it('shall fetch the first page when no arguments are passed', () => {
      const paginator = new OpenSearchPaginator(simpleUrl, {});
      return paginator.fetchPage()
        .then((page) => {
          expect(page).to.deep.equal({
            totalResults: 51,
            startIndex: 1,
            itemsPerPage: 25,
            records: (new Array(25)).fill({}),
          });
        });
    });

    it('shall fetch with page offset when requested', () => {
      const paginator = new OpenSearchPaginator(urlWithCountMax, {});
      return paginator.fetchPage(1)
        .then((page) => {
          expect(searchStub.calledWith(urlWithCountMax, sinon.match({ startIndex: 25 }))).to.be.ok;
          expect(page).to.deep.equal({
            totalResults: 51,
            startIndex: 25,
            itemsPerPage: 25,
            records: (new Array(25)).fill({}),
          });
        });
    });

    it('shall fetch the first n records, when maxCount is passed', () => {
      const paginator = new OpenSearchPaginator(simpleUrl, {});
      return paginator.fetchPage(0, 10)
        .then((page) => {
          expect(page).to.deep.equal({
            totalResults: 51,
            startIndex: 1,
            itemsPerPage: 10,
            records: (new Array(10)).fill({}),
          });
          expect(searchStub.calledWith(simpleUrl, sinon.match({ startIndex: 1, count: 10 })))
            .to.be.ok;
        });
    });
  });

  describe('fetchAllPages()', () => {
    it('shall fetch all pages', () => {
      const paginator = new OpenSearchPaginator(simpleUrl, {});
      return paginator.fetchAllPages()
        .then((pages) => {
          expect(pages).to.deep.equal([{
            totalResults: 51,
            startIndex: 1,
            itemsPerPage: 25,
            records: (new Array(25)).fill({}),
          }, {
            totalResults: 51,
            startIndex: 26,
            itemsPerPage: 25,
            records: (new Array(25)).fill({}),
          }, {
            totalResults: 51,
            startIndex: 51,
            itemsPerPage: 1,
            records: (new Array(1)).fill({}),
          }]);
          expect(searchStub.calledThrice).to.be.ok;
          expect(
            searchStub.firstCall.calledWith(simpleUrl, sinon.match({ startIndex: 1 }))
          ).to.be.ok;
          expect(
            searchStub.secondCall.calledWith(simpleUrl, sinon.match({ startIndex: 26 }))
          ).to.be.ok;
          expect(
            searchStub.thirdCall.calledWith(simpleUrl, sinon.match({ startIndex: 51 }))
          ).to.be.ok;
        });
    });
  });

  describe('fetchAllRecords()', () => {
    it('shall fetch all pages', () => {
      const paginator = new OpenSearchPaginator(simpleUrl, {});
      return paginator.fetchAllRecords()
        .then((pages) => {
          expect(pages).to.deep.equal({
            totalResults: 51,
            startIndex: 1,
            itemsPerPage: 25,
            records: (new Array(51)).fill({}),
          });
          expect(searchStub.calledThrice).to.be.ok;
          expect(
            searchStub.firstCall.calledWith(simpleUrl, sinon.match({ startIndex: 1 }))
          ).to.be.ok;
          expect(
            searchStub.secondCall.calledWith(simpleUrl, sinon.match({ startIndex: 26 }))
          ).to.be.ok;
          expect(
            searchStub.thirdCall.calledWith(simpleUrl, sinon.match({ startIndex: 51 }))
          ).to.be.ok;
        });
    });
  });

  describe('fetchFirstRecords()', () => {
    it('shall correctly fetch the first n records', () => {
      const paginator = new OpenSearchPaginator(simpleUrl, {});
      return paginator.fetchFirstRecords(40)
        .then((pages) => {
          expect(pages).to.deep.equal({
            totalResults: 51,
            startIndex: 1,
            itemsPerPage: 25,
            records: (new Array(40)).fill({}),
          });
        });
    });
  });

  describe('searchFirstRecords()', () => {
    it('shall correctly emit "page" and "success" events', (done) => {
      const paginator = new OpenSearchPaginator(simpleUrl, {});
      const emitter = paginator.searchFirstRecords();
      const onPageSpy = sinon.spy();

      emitter.on('page', onPageSpy);
      emitter.on('success', (results) => {
        expect(onPageSpy.calledThrice).to.be.ok;
        expect(results).to.deep.equal({
          totalResults: 51,
          startIndex: 1,
          itemsPerPage: 25,
          records: (new Array(51)).fill({}),
        });
        done();
      });
      emitter.on('error', done);
    });
  });

  it('shall correctly emit "page" and "success" events when paginator is given catalog information from previous run to continue', (done) => {
    const paginatorSettings = {
      serverItemsPerPage: 25,
      totalResults: 51,
      baseOffset: 25,
    };
    const maxCount = 200;
    const paginator = new OpenSearchPaginator(simpleUrl, {}, paginatorSettings);
    const emitter = paginator.searchFirstRecords(maxCount);
    const onPageSpy = sinon.spy();

    emitter.on('page', onPageSpy);
    emitter.on('success', (results) => {
      expect(onPageSpy.calledTwice).to.be.ok;
      expect(results).to.deep.equal({
        totalResults: 51,
        startIndex: 26,
        itemsPerPage: 25,
        records: (new Array(26)).fill({}),
      });
      done();
    });
    emitter.on('error', done);
  });
});
