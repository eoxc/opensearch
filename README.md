# OpenSearch JavaScript client

[![Build Status](https://travis-ci.org/eoxc/opensearch.svg?branch=master)](https://travis-ci.org/eoxc/opensearch) [![NPM](https://nodei.co/npm/opensearch-browser.png?mini=true)](https://nodei.co/npm/opensearch-browser/)


The full documentation is available [here](http://eoxc.github.io/opensearch/).

## Setup

To install the client framework perform the following steps:

    npm install opensearch-browser

## Usage

The easiest way to use the library is by using the `discover` function, which
takes a single parameter, the URL of the OpenSearch service:

```javascript
import { discover } from 'opensearch-browser';
// or: var discover = require('opensearch-browser').discover;

discover('http://example.com/search').then((service) => {
  service.search({ searchTerms: 'Test', startIndex: 1 }).then((results) => {
    // your results:
  });
});
```

This OpenSearch library requires `Promises`. If you are not sure whether you
have it available use the following polyfill:

```javascript
require('es6-promise').polyfill();
```

### Request parameters

Request parameters are supplied as an object whose attribute names shall either
be the URL parameter names or their types. For example, if the OpenSearch
service provides a URL like the following example:

```xml
<Url type="text/html"
  template="http://example.com/search?q={searchTerms}&amp;pw={startPage?}"
/>
```

then the the following request parameters are possible:

```javascript
// Using the types
service.search({ searchTerms: 'Test', startPage: 1 }).then( ... );

// Using the parameter names
service.search({ q: 'Test', pw: 1 }).then( ... );

// Omitting the optional parameter 'startPage'
service.search({ searchTerms: 'Test' }).then( ... );
```

An exception will be raised when mandatory parameters are not supplied.

Some parameter types will be automatically translated from their object
to their string representation:

| Parameter type                         | Object                             | Value                              |
| -------------------------------------- | ---------------------------------- | ---------------------------------- |
| `time:start` and `time:end`            | `Date`                             | an ISO 8601 string representation  |
| `geo:box`                              | `[left, bottom, right, top]`       | a string `"left,bottom,right,top"` |
| `geo:geometry`                         | GeoJSON Geometry `Object`          | the WKT representation             |
| all numeric types + datetime from `eo` | `Number`                           | `"<value>"`                        |
|                                        | `[value1, value2, ...]`            | `"{<value1>,<value2>,...}"`        |
|                                        | `{ min: minValue, max: maxValue }` | `"[<minValue>,<maxValue>]"`        |
|                                        | `{ min: minValue }`                | `"[<minValue>"`                    |
|                                        | `{ max: maxValue }`                | `"<maxValue>]"`                    |
|                                        | `{ minExclusive: minValue }`       | `"]<minValue>"`                    |
|                                        | `{ maxExclusive: maxValue }`       | `"<maxValue>["`                    |
|                                        | ...                                |                                    |

### Search Results

By default, the library is able to parse RSS, Atom and GeoJSON responses. They
are parsed to a structure based upon the GeoJSON format.

It is possible to extend the supported formats by adding additional format
handlers:

```javascript
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
```

When a search URL is used with that mime-type, the response is now parsed with
the registered handler.

Alternatively, raw responses can be used, and parsing be performed outside of
this library:

```javascript
var mimeType = null;
var raw = true;
service.search({ searchTerms: 'Test', startIndex: 1 }, mimeType, raw)
  .then(function(response) {
    // do something with the response
  });
```

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

In the future, also the [Extension for EO Products](https://portal.opengeospatial.org/files/?artifact_id=61006)
will be supported.