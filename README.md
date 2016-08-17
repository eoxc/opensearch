# OpenSearch JavaScript client

[![Build Status](https://travis-ci.org/eoxc/opensearch.svg?branch=master)](https://travis-ci.org/eoxc/opensearch)


The full documentation is available [here](http://eoxc.github.io/opensearch/).

## Setup

To install the client framework perform the following steps:

    npm install opensearch

## Usage

The easiest way to use the library is by using the `discover` function, which
takes a single parameter, the URL of the OpenSearch service:

    import { discover } from 'opensearch';
    // or: var discover = require('opensearch').discover;

    discover('http://example.com/search').then((service) => {
      service.search({ searchTerms: 'Test', startIndex: 1 }).then((results) => {
        // your results:
      });
    });


This OpenSearch library requires `Promises`. If you are not sure whether you
have it available use the following polyfill:

    require('es6-promise').polyfill();

### Request parameters

Request parameters are supplied as an object whose attribute names shall either
be the URL parameter names or their types. For example, if the OpenSearch
service provides a URL like the following example:

    <Url type="text/html"
      template="http://example.com/search?q={searchTerms}&amp;pw={startPage?}"
    />

then the the following request parameters are possible:

    // Using the types
    service.search({ searchTerms: 'Test', startPage: 1 }).then( ... );

    // Using the parameter names
    service.search({ q: 'Test', pw: 1 }).then( ... );

    // Omitting the optional parameter 'startPage'
    service.search({ searchTerms: 'Test' }).then( ... );

An exception will be raised when mandatory parameters are not supplied.

### Search Results

By default, the library is able to parse RSS, Atom and GeoJSON responses. They
are parsed to a structure based upon the GeoJSON format.

It is possible to extend the supported formats by adding additional format
handlers:

    import { registerFormat } from 'opensearch/formats/index';

    var format = {
      parse: function(response) {
        return response.text().then(function(text) {
          // ...
          return ...;
        });
      }
    };

    // register the format under the given mime-type
    registerFormat('application/vnd.special+xml', format);

When a search URL is used with that mime-type, the response is now parsed with
the registered handler.

Alternatively, raw responses can be used, and parsing be performed outside of
this library:

    var mimeType = null;
    var raw = true;
    service.search({ searchTerms: 'Test', startIndex: 1 }, mimeType, raw)
      .then(function(response) {
        // do something with the response
      });

For both cases, the response is a
[Response](https://developer.mozilla.org/en-US/docs/Web/API/Response) object
from the `fetch` API.

## Testing

To run the unit tests do

    npm test

To run the unit tests continuously, run the following command:

    npm run test:watch

## Documentation

To generate the API documentation run:

    npm run docs

## Notes

This library aims to provide a broad support of the most common OpenSearch
functionality and exchange formats. It also supports the
[Geo](http://www.opensearch.org/Specifications/OpenSearch/Extensions/Geo/1.0/Draft_1) and
[Time](http://www.opensearch.org/Specifications/OpenSearch/Extensions/Time/1.0/Draft_1) extensions and adheres to various points of the
[CEOS OpenSearch best practice paper](http://ceos.org/document_management/Working_Groups/WGISS/Interest_Groups/OpenSearch/CEOS-OPENSEARCH-BP-V1.1-Final.pdf).
