import parse from 'url-parse';
import { xPathArray, resolver, namespaces, getAttributeNS } from './utils';
import { OpenSearchParameter } from './parameter';


/**
 * Class to parse a single URL of an OpenSearchDescription XML document and
 * to create HTTP requests for searches.
 * @property {string} type The mime-type for the content the URL is referring to
 * @property {string} url The URL template or base URL
 * @property {array} parameters The template/request parameters of the URL
 * @property {string} method The HTTP method
 * @property {string} enctype The encoding type
 * @property {Number} indexOffset the index offset of this URL
 * @property {Number} pageOffset the page offset of this URL
 */
export class OpenSearchUrl {
  /**
   * Create an OpenSearchUrl object
   * @param {string} type The mime-type for the content the URL is referring to
   * @param {string} url The URL template or base URL
   * @param {array} parameters The template/request parameters of the URL
   * @param {string} parameters[].name The parameters name
   * @param {string} parameters[].type The parameters type
   * @param {boolean} parameters[].mandatory Whether the parameter is mandatory
   * @param {string} [method='GET'] The HTTP method
   * @param {string} [enctype='application/x-www-form-urlencoded'] The encoding type
   * @param {Number} [indexOffset=1] The index offset of this URL
   * @param {Number} [pageOffset=1] The page offset of this URL
   * @param {string[]} [relations=['results']] The relations of this URL.
   */
  constructor(type, url, parameters = [], method = 'GET',
              enctype = 'application/x-www-form-urlencoded',
              indexOffset = 1, pageOffset = 1, relations = ['results']) {
    this._type = type;
    this._url = url;
    this._method = method;
    this._enctype = enctype;
    this._indexOffset = indexOffset;
    this._pageOffset = pageOffset;
    this._relations = relations;

    this._parameters = parameters;
    this._parametersByName = {};
    this._parametersByType = {};
    parameters.forEach(param => {
      this._parametersByType[param.type] = param;
      this._parametersByName[param.name] = param;
    });
  }

  /**
   * The mime-type for the content the URL is referring to
   * @readonly
   */
  get type() {
    return this._type;
  }

  /**
   * The URL template or base URL
   * @readonly
   */
  get url() {
    return this._url;
  }

  /**
   * The HTTP method
   * @readonly
   */
  get method() {
    return this._method;
  }

  /**
   * The encoding type
   * @readonly
   */
  get enctype() {
    return this._enctype;
  }

  /**
   * The index offset of this URL
   * @readonly
   */
  get indexOffset() {
    return this._indexOffset;
  }

  /**
   * The page offset of this URL
   * @readonly
   */
  get pageOffset() {
    return this._pageOffset;
  }

  /**
   * The page offset of this URL
   * @readonly
   */
  get relations() {
    return this._relations;
  }

  /**
   * The template/request parameters of the URL
   * @readonly
   */
  get parameters() {
    return this._parameters;
  }

  /**
   * Returns whether the URL has a template parameter of the given type
   * @param {string} type The parameter type to check
   * @returns {boolean} Whether the URL has a parameter of that type
   */
  hasParameter(type) {
    return this._parametersByType.hasOwnProperty(type);
  }

  /**
   * Checks whether this URL is compatible with the given parameters
   * @param {object} parameters An object mapping the name or type to the value
   * @returns {boolean} Whether or not the URL is compatible with the given parameters
   */
  isCompatible(parameters) {
    let compatible = true;
    Object.keys(parameters).forEach(key => {
      if (!this._parametersByType.hasOwnProperty(key)
          && !this._parametersByName.hasOwnProperty(key)) {
        compatible = false;
      }
    });
    if (!compatible) {
      return false;
    }

    const missingMandatoryParameters = this.parameters.filter(
      (parameter) => parameter.mandatory
        && !parameters.hasOwnProperty(parameter.name)
        && !parameters.hasOwnProperty(parameter.type)
    );
    if (missingMandatoryParameters.length) {
      return false;
    }
    return true;
  }

  /**
   * Create a request for the given parameters
   * @param {object} parameterValues An object mapping the name or type to the value
   * @returns {Request} The {@link https://developer.mozilla.org/en-US/docs/Web/API/Request Request}
   *                    object for the
   *                    {@link https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API Fetch API}
   */
  createRequest(parameterValues) {
    // check parameters
    Object.keys(parameterValues).forEach(key => {
      if (!this._parametersByType.hasOwnProperty(key)
          && !this._parametersByName.hasOwnProperty(key)) {
        throw new Error(`Invalid parameter '${key}'.`);
      }
    });

    const missingMandatoryParameters = this.parameters.filter(
      (parameter) => parameter.mandatory
        && !parameterValues.hasOwnProperty(parameter.name)
        && !parameterValues.hasOwnProperty(parameter.type)
    ).map((parameter) => parameter.type);

    const missingOptionalParameters = this.parameters.filter(
      (parameter) => !parameter.mandatory
        && !parameterValues.hasOwnProperty(parameter.name)
        && !parameterValues.hasOwnProperty(parameter.type)
    ).map((parameter) => parameter.type);

    if (missingMandatoryParameters.length) {
      throw new Error(`Missing mandatory parameters: ${missingMandatoryParameters.join(', ')}`);
    }

    if (this.method === 'GET') {
      // insert parameters into URL template
      let url = this.url;

      Object.keys(parameterValues).forEach(key => {
        const parameter = this._parametersByType[key] || this._parametersByName[key];
        url = url.replace(
          new RegExp(`{${parameter.type}[?]?}`),
          parameter.serialize(parameterValues[key])
        );
      });

      missingOptionalParameters.forEach(type => {
        url = url.replace(new RegExp(`{${type}[?]?}`), '');
      });

      return new Request(url);
    }

    // for POST
    const enctype = this.enctype || 'application/x-www-form-urlencoded';
    let body = null;
    if (enctype === 'application/x-www-form-urlencoded') {
      body = Object.keys(parameterValues).map(key => {
        const param = (this._parametersByType[key] || this._parametersByName[key]);
        const k = encodeURIComponent(param.name);
        const v = encodeURIComponent(param.serialize(parameterValues[key]));
        return `${k}=${v}`;
      }).join('&');
    } else if (enctype === 'multipart/form-data') {
      body = new FormData();
      Object.keys(parameterValues).forEach(key => {
        const param = (this._parametersByType[key] || this._parametersByName[key]);
        body.append(param.name, param.serialize(parameterValues[key]));
      });
    } else {
      throw new Error(`Unsupported enctype '${enctype}'.`);
    }

    return new Request(this.url, {
      method: this.method,
      headers: {
        'Content-Type': enctype,
      },
      body,
    });
  }

  /**
   * Construct a {@link OpenSearchUrl} from a DOMNode
   * @param {DOMNode} node The DOM node from the OpenSearchDescription XML document
   * @returns {OpenSearchUrl} The constructed OpenSearchUrl object
   */
  static fromNode(node) {
    const parameterNodes = xPathArray(node, 'parameters:Parameter', resolver);
    const method = getAttributeNS(node, namespaces.parameters, 'method');
    const enctype = getAttributeNS(node, namespaces.parameters, 'enctype');
    const indexOffset = node.hasAttribute('indexOffset') ?
      parseInt(node.getAttribute('indexOffset'), 10) : 1;
    const pageOffset = node.hasAttribute('pageOffset') ?
      parseInt(node.getAttribute('pageOffset'), 10) : 1;
    const rel = node.getAttribute('rel');
    const relations = (typeof rel === 'undefined' || rel === '') ? undefined : rel.split(' ');

    const parsed = parse(node.getAttribute('template'), true);
    const parametersFromTemplate = Object.keys(parsed.query)
      .map(name => OpenSearchParameter.fromKeyValuePair(name, parsed.query[name]))
      .filter(parameter => parameter);
    const parametersFromNode = parameterNodes.map(OpenSearchParameter.fromNode);

    const parametersNotInTemplate = parametersFromNode.filter(
      p1 => !parametersFromTemplate.find(p2 => p1.name === p2.name)
    ).map(param => {
      param._mandatory = (typeof param.mandatory === 'undefined') ? true : param.mandatory;
      return param;
    });

    // merge parameters from node and template
    const parameters = parametersFromTemplate.map(p1 => {
      const p2 = parametersFromNode.find(p => p1.name === p.name);
      if (p2) {
        return p1.combined(p2);
      }
      return p1;
    }).concat(parametersNotInTemplate);

    return new OpenSearchUrl(
      node.getAttribute('type'), node.getAttribute('template'),
      parameters, method, enctype, indexOffset, pageOffset, relations
    );
  }

  /**
   * Construct a {@link OpenSearchUrl} from a template URL
   * @param {string} type The mime-type
   * @param {string} templateUrl The template URL string.
   * @param {string} [method='GET'] The HTTP method
   * @param {string} [enctype='application/x-www-form-urlencoded'] The encoding type
   * @returns {OpenSearchUrl} The constructed OpenSearchUrl object
   */
  static fromTemplateUrl(type, templateUrl, method = 'GET',
                         enctype = 'application/x-www-form-urlencoded') {
    const parsed = parse(templateUrl, true);
    const parameters = Object.keys(parsed.query)
      .map(name => OpenSearchParameter.fromKeyValuePair(name, parsed.query[name]))
      .filter(parameter => parameter);
    return new OpenSearchUrl(type, templateUrl, parameters, method, enctype);
  }
}
