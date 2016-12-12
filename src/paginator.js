import { search } from './utils';

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
  constructor(url, parameters, {useCache = true,
                                preferredItemsPerPage = undefined,
                                preferStartIndex = true} = {}) {
    this._url = url;
    this._parameters = parameters;
    this._cache = useCache ? {} : null;
    this._preferredItemsPerPage = preferredItemsPerPage;
    this._preferStartIndex = preferStartIndex;
    this._serverItemsPerPage = undefined;
    this._totalResults = undefined;
  }

  /**
   * Fetch a single page of the result set. Sets the server side items per page,
   * when the result is available.
   * @param {int} [pageIndex=0] The index of the page to be fetched.
   * @returns {Promise<SearchResult>} The search result.
   */
  fetchPage(pageIndex = 0) {
    // TODO: get first page index

    if (this._cache && this._cache[pageIndex]) {
      return this._cache[pageIndex];
    }
    const parameters = {
      ...this._parameters,
    };

    const pageSize = this.getActualPageSize();
    if (pageSize) {
      parameters.count = pageSize;
    }

    if (this._preferStartIndex) {
      if (typeof pageSize === 'undefined') {
        parameters.startIndex = this._url.indexOffset;
      } else {
        parameters.startIndex = pageSize * pageIndex + this._url.indexOffset;
      }
    } else {
      parameters.startPage = pageIndex + this._url.pageOffset;
    }
    return search(this._url, parameters)
      .then(result => {
        if (!this._serverItemsPerPage && result.itemsPerPage) {
          this._serverItemsPerPage = result.itemsPerPage;
        }
        return result;
      });
  }

  /**
   * Fetches all pages from the URL. A probing request is sent to determine how
   * many succeding requests have to be sent.
   * @returns {Promise<SearchResult[]>} The async result of all the pages in the
   *                                    search.
   */
  fetchAllPages() {
    return this.fetchPage()
      .then(firstPage => {
        this._totalResults = firstPage.totalResults;
        const pageCount = this.getPageCount() - 1;
        const requests = [firstPage];
        for (let i = 0; i < pageCount; ++i) {
          requests.push(this.fetchPage(i));
        }
        return Promise.all(requests);
      });
  }

  /**
   * Convenience method to get the records of all pages in a single result array
   * @returns {Promise<Record[]>} The records of all the pages in the search.
   */
  fetchAllRecords() {
    return this.fetchAllPages()
      .then(pages => pages.reduce((records, page) => {
        return records.concat(page.records);
      }, []));
  }

  /**
   * Returns the actual page size.
   * @returns {int} The computed page size.
   */
  getActualPageSize() {
    if (this._preferredItemsPerPage && this._serverItemsPerPage) {
      return Math.min(this._preferredItemsPerPage, this._serverItemsPerPage);
    } else if(this._serverItemsPerPage) {
      return this._serverItemsPerPage;
    } else if (this._preferredItemsPerPage) {
      return this._preferredItemsPerPage;
    }
    const countParam = this._url.getParameter('count');
    if (countParam) {
      return countParam.minInclusive || countParam.maxInclusive;
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
