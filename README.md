# OpenSearch JavaScript client

[![Build Status](https://travis-ci.org/eoxc/opensearch.svg?branch=master)](https://travis-ci.org/eoxc/opensearch)


The full documentation is available [here](http://eoxc.github.io/opensearch/).

## Setup

To install the client framework perform the following steps:

    npm install opensearch

## Usage

TODO!

    import { discover } from 'opensearch';
    discover('http://example.com/search').then((service) => {
      service.search({ searchTerms: 'Test', startIndex: 1 }).then((results) => {
        // your results:
      });
    });


This OpenSearch library requires `Promises`. If you are not shure whether you
have it available use the following polyfill:

    require('es6-promise').polyfill();

## Testing

To run the unit tests do

    npm test

To run the unit tests continuously do

    npm run test:watch

## Documentation

To generate the API documentation run:

    npm run docs
