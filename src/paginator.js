import EventEmitter from 'event-emitter';
import { search } from './search';
import { assign } from './utils';
import { config } from './config';


/**
 * @module opensearch/paginator
 */

/**
 * Event emitter to track the progress of paged searches.
 *
 * @fires PagedSearchProgressEmitter#page
 * @fires PagedSearchProgressEmitter#success
 * @fires PagedSearchProgressEmitter#error
 */
class PagedSearchProgressEmitter extends EventEmitter {
}

/**
 * Search Progress Event
 *
 * @event module:opensearch/paginator~PagedSearchProgressEmitter#page
 * @type {SearchResult}
 */

/**
 * Search Success Event
 *
 * @event module:opensearch/paginator~PagedSearchProgressEmitter#success
 * @type {SearchResult}
 */

/**
 * Search Error Event
 *
 * @event module:opensearch/paginator~PagedSearchProgressEmitter#error
 * @type {Error}
 */

export { PagedSearchProgressEmitter };


function isCancellable(promise) {
  return promise && typeof promise.cancel === 'function' && !promise.isCancelled();
}

function combinePages(pages) {
  const firstPage = pages[0];
  const records = pages.reduce((rs, page) => rs.concat(page.records), []);
  return {
    totalResults: firstPage.totalResults,
    startIndex: firstPage.startIndex,
    itemsPerPage: firstPage.itemsPerPage,
    records,
  };
}

/**
 * Class to help with paginated results of an OpenSearch service.
 */
export class OpenSearchPaginator {
  /**
   * @param {OpenSearchUrl} url The URL to perform all subsequent requests on.
   * @param {object} parameters Search parameters.
   * @param {object} [options] Additional options for the pagination
   * @param {boolean} [options.useCache=true] Whether response pages shall be cached.
   * @param {int} [options.preferredItemsPerPage=undefined] The preferred page size. This
   *                                                        defaults to the advertised
   *                                                        default of the URL.
   * @param {boolean} [options.preferStartIndex=true] Whether the paging shall be done
   *                                                  using the `startIndex` parameter
   *                                                  (the default) or the `startPage`.
   * @param {int} [options.totalResults=undefined] Total results on all pages. Can be set from
   *                                            previous searches for optimized `searchFirstRecords`
   * @param {int} [options.serverItemsPerPage=undefined] Server allowed page size. Can be set from
   *                                            previous searches for optimized `searchFirstRecords`
   * @param {int} [options.baseOffset=0] The base index offset to apply. This option
   *                                     is useful when resuming a consecutive search.
   * @param {int} [options.maxUrlLength=undefined] The maximum URL length. Forwarded to
   *                                               [search]{@link module:opensearch/search.search}.
   * @param {boolean} [options.dropEmptyParameters=false] Whether unused parameter keys shall
   *                                                      be dropped from the request.
   */
  constructor(url, parameters, options = {}) {
    const {
      useCache = true,
      preferredItemsPerPage = undefined,
      preferStartIndex = true,
      baseOffset = 0,
      totalResults = undefined,
      serverItemsPerPage = undefined,
      ...searchOptions
    } = options;
    this._url = url;
    this._parameters = parameters;
    this._cache = useCache ? {} : null;
    this._preferredItemsPerPage = preferredItemsPerPage;
    this._preferStartIndex = preferStartIndex;
    this._baseOffset = baseOffset;
    this._totalResults = totalResults;
    this._serverItemsPerPage = serverItemsPerPage;
    this._searchOptions = searchOptions;
  }

  /**
   * Fetch a single page of the result set. Sets the server side items per page,
   * when the result is available.
   * @param {int} [pageIndex=0] The index of the page to be fetched.
   * @param {int} [maxCount=undefined] The maximum count of objects to be retrieved.
   * @returns {Promise<SearchResult>} The search result.
   * @fulfill {module:opensearch/formats~SearchResult} The search result
   */
  fetchPage(pageIndex = 0, maxCount = undefined) {
    // TODO: implement caching of whole pages
    // if (this._cache && this._cache[pageIndex]) {
    //   return this._cache[pageIndex];
    // }
    const parameters = assign({}, this._parameters);

    const pageSize = this.getActualPageSize();
    if (pageSize && maxCount) {
      parameters.count = Math.min(maxCount, pageSize);
    } else if (pageSize) {
      parameters.count = pageSize;
    } else if (maxCount) {
      parameters.count = maxCount;
    }

    if (this._preferStartIndex) {
      if (typeof pageSize === 'undefined') {
        parameters.startIndex = this._baseOffset + this._url.indexOffset;
      } else {
        parameters.startIndex = this._baseOffset + (pageSize * pageIndex) + this._url.indexOffset;
      }
    } else {
      parameters.startPage = pageIndex + this._url.pageOffset;
    }
    return search(this._url, parameters, this._searchOptions)
      .then((result) => {
        this._totalResults = result.totalResults;
        if (!this._serverItemsPerPage && result.itemsPerPage) {
          this._serverItemsPerPage = result.itemsPerPage;
        }
        return result;
      });
  }

  /**
   * Fetches all pages from the URL. A probing request is sent to determine how
   * many succeeding requests have to be sent.
   * @returns {Promise<SearchResult[]>} The async result of all the pages in the
   *                                    search.
   * @fulfill {module:opensearch/formats~SearchResult[]} The search result pages
   */
  fetchAllPages() {
    return this.fetchPage()
      .then((firstPage) => {
        const pageCount = this.getPageCount();
        const requests = [firstPage];
        for (let i = 1; i < pageCount; ++i) {
          requests.push(this.fetchPage(i));
        }
        const { Promise } = config();
        return Promise.all(requests);
      });
  }

  /**
   * Convenience method to get the records of all pages in a single result array
   * @returns {Promise<SearchResult>} The records of all the pages in the search.
   * @fulfill {module:opensearch/formats~SearchResult} The search result
   */
  fetchAllRecords() {
    return this.fetchAllPages()
      .then((pages) => {
        const firstPage = pages[0];
        const records = pages.reduce((rs, page) => rs.concat(page.records), []);
        return {
          totalResults: firstPage.totalResults,
          startIndex: firstPage.startIndex,
          itemsPerPage: firstPage.itemsPerPage,
          records,
        };
      });
  }

  /**
   * Fetches the first X records of a search in a single search result.
   * @param {int} maxCount The maximum number of records to fetch.
   * @returns {Promise<SearchResult>} The resulting records as a promise.
   * @fulfill {module:opensearch/formats~SearchResult} The search result
   */
  fetchFirstRecords(maxCount) {
    // Get the first page
    return this.fetchPage(0, maxCount)
      .then((firstPage) => {
        // check if all records fit in the first page (then return this page)
        if (firstPage.totalResults <= firstPage.itemsPerPage) {
          // return if we already have all records
          return firstPage;
        }
        // fetch other pages until we have the required count
        const requests = [firstPage];
        const usedMaxCount =
          Math.min(
            maxCount,
            (firstPage.totalResults - firstPage.startIndex) + this._url.indexOffset
          );

        // determine the number of pages and issue a request for each
        const numPages = firstPage.itemsPerPage ?
          Math.ceil(usedMaxCount / firstPage.itemsPerPage) : 1;
        for (let i = 1; i < numPages; ++i) {
          let count = firstPage.itemsPerPage;
          if (firstPage.itemsPerPage * (i + 1) > usedMaxCount) {
            count = usedMaxCount - (firstPage.itemsPerPage * i);
          }
          requests.push(this.fetchPage(i, count));
        }

        return Promise.all(requests)
          .then(pages => combinePages(pages));
      });
  }

  /**
   * Fetches the first X records of a search in a single search result.
   * Use this method when the progressive results are wished and not just a
   * final result.
   * @param {int} maxCount The maximum number of records to fetch.
   * @param {boolean} preserveOrder Whether the results must be returned in the
   *                                order received from the server, or the
   *                                originally requested order.
   * @returns {module:opensearch/paginator~PagedSearchProgressEmitter} The resulting
   *                                                                   records as a promise.
   */
  searchFirstRecords(maxCount = undefined, preserveOrder = true) {
    // Get the first page
    const emitter = new PagedSearchProgressEmitter();
    let request = null;
    let startPageIndex = null;
    if (this._serverItemsPerPage && this._totalResults && typeof maxCount !== 'undefined' && maxCount !== 0) {
      // if paginator created based on known values - continue search
      // do not request first page to get values
      request = Promise.resolve({
        itemsPerPage: this._serverItemsPerPage,
        records: [],
        totalResults: this._totalResults,
        startIndex: this._baseOffset,
      });
      startPageIndex = 0;
    } else {
      // start requesting the first page
      request = this.fetchPage(0, maxCount);
      startPageIndex = 1;
    }
    let requests = [request];

    // cancel requests when issued a cancel event
    emitter.on('cancel', () => {
      requests.forEach((req) => {
        if (isCancellable(req)) {
          req.cancel();
        }
      });
    });

    let hasError = false;
    const onError = (error) => {
      hasError = true;
      emitter.emit('error', error);
      return error;
    };

    request
      .catch(onError)
      .then((firstPage) => {
        if (hasError) {
          throw firstPage;
        }
        // save the first page as a resolved promise (for later use when
        // collecting results in a uniform fashion) in case it was fetched
        const newRequests = [];
        if (startPageIndex === 1) {
          newRequests.push(Promise.resolve(firstPage));
        }
        const usedMaxCount = maxCount
          ? Math.min(
            maxCount,
            (firstPage.totalResults - firstPage.startIndex) + this._url.indexOffset
          ) : firstPage.totalResults;

        // determine the number of pages and issue a request for each
        const numPages = firstPage.itemsPerPage ?
          Math.ceil(usedMaxCount / firstPage.itemsPerPage) : 1;
        for (let i = startPageIndex; i < numPages; ++i) {
          let count = firstPage.itemsPerPage;
          if (firstPage.itemsPerPage * (i + 1) > usedMaxCount) {
            count = usedMaxCount - (firstPage.itemsPerPage * i);
          }
          newRequests.push(this.fetchPage(i, count));
        }

        // save the requests in the global variable to allow cancellation/result collection
        requests = newRequests;

        const pages = Array(requests.length);

        if (preserveOrder) {
          // when the order of the the responses is important, the algorithm is
          // more complex
          let index = 0;
          const allRequests = Array.from(requests);
          const onPage = (page) => {
            if (hasError) {
              return;
            }
            pages[index] = page;
            index += 1;
            emitter.emit('page', page);
            const promise = allRequests.shift();
            if (promise) {
              promise.then(onPage, onError);
            } else {
              emitter.emit('success', combinePages(pages)); // TODO:
            }
          };
          allRequests.shift().then(onPage, onError);
        } else {
          let successCount = 0;
          requests.forEach((req, index) => {
            req.then((page) => {
              if (hasError) {
                return;
              }
              successCount += 1;
              pages[index] = page;
              if (successCount === requests.length) {
                emitter.emit('success', combinePages(pages)); // TODO
              }
            }, onError);
          });
        }
      });
    return emitter;
  }

  /**
   * Returns the actual page size.
   * @returns {int} The computed page size.
   */
  getActualPageSize() {
    if (this._preferredItemsPerPage && this._serverItemsPerPage) {
      return Math.min(this._preferredItemsPerPage, this._serverItemsPerPage);
    } else if (this._serverItemsPerPage) {
      return this._serverItemsPerPage;
    } else if (this._preferredItemsPerPage) {
      return this._preferredItemsPerPage;
    }
    const countParam = this._url.getParameter('count');
    if (countParam) {
      if (typeof countParam.maxExclusive !== 'undefined') {
        return countParam.maxExclusive - 1;
      } else if (countParam.maxInclusive) {
        return countParam.maxInclusive;
      }
    }
    return undefined;
  }

  /**
   * Returns the computed number of pages, which is available once the first page
   * was received.
   * @returns {int} The number of pages.
   */
  getPageCount() {
    const pageSize = this.getActualPageSize();
    if (!this._totalResults) {
      return this._totalResults;
    } else if (!pageSize) {
      return undefined;
    }
    return Math.ceil(this._totalResults / pageSize);
  }
}
