import { expect } from 'chai';
import { search } from '../src/search';
import { config } from '../src/config';
import { OpenSearchService } from '../src/service';

// import fetchMock after isomorphic-fetch was set up to not confuse global `Request`
// eslint-disable-next-line import/order
import fetchMock from 'fetch-mock';
// eslint-disable-next-line import/order
import BluebirdPromise from 'bluebird';
// eslint-disable-next-line import/order
import xhrMock from 'xhr-mock';

BluebirdPromise.config({ cancellation: true, warnings: false });
const osddExample = require('./data/OSDD_example.xml');
const atomExample = require('./data/atom_example.xml');

let savedConfig = null;

describe('search', () => {
  before(() => {
    fetchMock
      .mock('begin:http://example.com/?q=', atomExample);

    xhrMock.setup();
    // eslint-disable-next-line
    xhrMock.get(new RegExp('.*'), (req, res) => res
      .status(200)
      .body(atomExample));

    savedConfig = { ...config() };
  });
  after(() => {
    fetchMock.restore();
    xhrMock.teardown();

    config(savedConfig);
  });

  const service = OpenSearchService.fromXml(osddExample);

  it('should work with XHR based searches', () => {
    config({ useXHR: true });
    return search(service.getDescription().getUrl(), { searchTerms: 'terms' })
      .then((results) => {
        expect(results.records).to.have.lengthOf(1);
      });
  });

  it('should work with fetch based searches', () => {
    config({ useXHR: false });
    return search(service.getDescription().getUrl(), { searchTerms: 'terms' })
      .then((results) => {
        expect(results.records).to.have.lengthOf(1);
      });
  });

  it('shall produce the same result with XHR and fetch', () => {
    const searches = [];
    config({ useXHR: true });
    searches.push(search(service.getDescription().getUrl(), { searchTerms: 'terms' }));
    config({ useXHR: false });
    searches.push(search(service.getDescription().getUrl(), { searchTerms: 'terms' }));

    return Promise.all(searches)
      .then(([xhrResult, fetchResult]) => {
        expect(xhrResult).to.deep.equal(fetchResult);
      });
  });
});

const errorXml = `<?xml version="1.0" encoding="UTF-8"?><ows:ExceptionReport xmlns:ows="http://www.opengis.net/ows/2.0" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" version="1.0.0" xml:lang="en" xsi:schemaLocation="http://www.opengis.net/ows/2.0 http://schemas.opengis.net/ows/2.0/owsExceptionReport.xsd">
<ows:Exception exceptionCode="InvalidParameterValue" locator="httpAccept">
<ows:ExceptionText>MIME type {xapplication/atom+xml} is not supported for dataset series {EOP:CODE-DE:S1_SAR_L1_GRD}.</ows:ExceptionText>
</ows:Exception>
</ows:ExceptionReport>`;

describe('search errors', () => {
  before(() => {
    fetchMock
      .mock('begin:http://example.com/?q=', {
        status: 400,
        body: errorXml,
      });

    xhrMock.setup();
    // eslint-disable-next-line
    xhrMock.get(new RegExp('.*'), (req, res) => res
      .status(400)
      .body(errorXml));

    savedConfig = { ...config() };
  });
  after(() => {
    fetchMock.restore();
    xhrMock.teardown();

    config(savedConfig);
  });

  const service = OpenSearchService.fromXml(osddExample);

  it('should correctly report errors with XHR based searches', () => {
    config({ useXHR: true });
    return search(service.getDescription().getUrl(), { searchTerms: 'terms' })
      .catch((error) => {
        expect(error.message).to.equal('MIME type {xapplication/atom+xml} is not supported for dataset series {EOP:CODE-DE:S1_SAR_L1_GRD}.');
      }).then();
  });

  it('should correctly report errors with fetch based searches', () => {
    config({ useXHR: false });
    return search(service.getDescription().getUrl(), { searchTerms: 'terms' })
      .catch((error) => {
        expect(error.message).to.equal('MIME type {xapplication/atom+xml} is not supported for dataset series {EOP:CODE-DE:S1_SAR_L1_GRD}.');
      }).then();
  });

  it('shall use cancellable BluebirdPromise if configured', () => {
    config({ useXHR: true, Promise: BluebirdPromise });
    const searchPromise = search(service.getDescription().getUrl(), { searchTerms: 'terms' });
    searchPromise.cancel();
    // eslint-disable-next-line no-unused-expressions
    expect(searchPromise.isCancelled()).to.be.true;
  });
});
