import EventEmitter from 'event-emitter';
import { search } from './search';
import { assign } from './utils';

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
 * @event PagedSearchProgressEmitter#page
 * @type {SearchResult}
 */

/**
 * Search Success Event
 *
 * @event PagedSearchProgressEmitter#success
 * @type {SearchResult}
 */

/**
 * Search Error Event
 *
 * @event PagedSearchProgressEmitter#error
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
   * @param {boolean} [useCache=true] Whether response pages shall be cached.
   * @param {int} [preferredItemsPerPage=undefined] The preferred page size. This
   *                                                defaults to the advertised
   *                                                default of the URL.
   * @param {boolean} [preferStartIndex=true] Whether the paging shall be done
   *                                          using the `startIndex` parameter
   *                                          (the default) or the `startPage`.
   */
  constructor(url, parameters, { useCache = true,
                                 preferredItemsPerPage = undefined,
                                 preferStartIndex = true,
                                 baseOffset = 0 } = {}) {
    this._url = url;
    this._parameters = parameters;
    this._cache = useCache ? {} : null;
    this._preferredItemsPerPage = preferredItemsPerPage;
    this._preferStartIndex = preferStartIndex;
    this._baseOffset = baseOffset;
    this._serverItemsPerPage = undefined;
    this._totalResults = undefined;
  }

  /**
   * Fetch a single page of the result set. Sets the server side items per page,
   * when the result is available.
   * @param {int} [pageIndex=0] The index of the page to be fetched.
   * @param {int} [maxCount=undefined] The maximum count of objects to be retrieved.
   * @returns {Promise<SearchResult>} The search result.
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
    return search(this._url, parameters)
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
   */
  fetchAllPages() {
    return this.fetchPage()
      .then((firstPage) => {
        const pageCount = this.getPageCount();
        const requests = [firstPage];
        for (let i = 1; i < pageCount; ++i) {
          requests.push(this.fetchPage(i));
        }
        return Promise.all(requests);
      });
  }

  /**
   * Convenience method to get the records of all pages in a single result array
   * @returns {Promise<SearchResult>} The records of all the pages in the search.
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
        const numPages = Math.ceil(
          Math.min(maxCount, firstPage.totalResults) / firstPage.itemsPerPage
        );
        for (let i = 1; i < numPages; ++i) {
          let count = firstPage.itemsPerPage;
          if (firstPage.itemsPerPage * (i + 1) > maxCount) {
            count = maxCount - (firstPage.itemsPerPage * (i - 1));
          }
          requests.push(this.fetchPage(i, count));
        }

        return Promise.all(requests)
          .then(pages => combinePages(pages));
      });
  }

  /**
   * Fetches the first X records of a search in a single search result.
   * Use this method when the progressive results are whished and not just a
   * final result.
   * @param {int} maxCount The maximum number of records to fetch.
   * @param {boolean} preserveOrder Whether the results must be returned in the
   *                                order received from the server, or the
   *                                orignally requested order.
   * @returns {PagedSearchProgressEmitter} The resulting records as a promise.
   */
  searchFirstRecords(maxCount = undefined, preserveOrder = true) {
    // Get the first page
    const emitter = new PagedSearchProgressEmitter();

    // start requesting the first page
    const request = this.fetchPage(0, maxCount);
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
        // collecting results in a uniform fashion)
        const newRequests = [Promise.resolve(firstPage)];
        const usedMaxCount =
          maxCount ? Math.min(maxCount, firstPage.totalResults) : firstPage.totalResults;

        // determine the number of pages and issue a request for each
        const numPages = Math.ceil(
          Math.min(usedMaxCount, firstPage.totalResults) / firstPage.itemsPerPage
        );
        for (let i = 1; i < numPages; ++i) {
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
