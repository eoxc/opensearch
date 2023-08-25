import parse from 'url-parse';
import { getElements, getAttributeNS, find } from './utils';
import { OpenSearchParameter } from './parameter';

/**
 * @module opensearch/url
 */

function isParameterMissing(parameterValues, parameter) {
  if (Object.prototype.hasOwnProperty.call(parameterValues, parameter.name)) {
    return false;
  } if (parameter.isMulti) {
    const types = parameter.type;
    for (let i = 0; i < types.length; ++i) {
      const type = types[i];
      if (Object.prototype.hasOwnProperty.call(parameterValues, type)) {
        return false;
      }
    }
    return true;
  }
  return !Object.prototype.hasOwnProperty.call(parameterValues, parameter.type);
}

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
   * @param {OpenSearchParameter[]} parameters The template/request parameters of the URL
   * @param {string} [method='GET'] The HTTP method
   * @param {string} [enctype='application/x-www-form-urlencoded'] The encoding type
   * @param {Number} [indexOffset=1] The index offset of this URL
   * @param {Number} [pageOffset=1] The page offset of this URL
   * @param {string[]} [relations=['results']] The relations of this URL.
   */
  constructor(
    type,
    url,
    parameters = [],
    method = 'GET',
    enctype = 'application/x-www-form-urlencoded',
    indexOffset = 1,
    pageOffset = 1,
    relations = ['results']
  ) {
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
    this._multiParameters = {};
    parameters.forEach((param) => {
      const paramType = param.type;
      if (Array.isArray(paramType)) {
        for (let i = 0; i < paramType.length; ++i) {
          this._parametersByType[paramType[i]] = param;
        }
      } else {
        this._parametersByType[paramType] = param;
      }
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
    return Object.prototype.hasOwnProperty.call(this._parametersByType, type);
  }

  /**
   * Get the parameter of the specified type, if available
   * @param {string} type The parameter type to check
   * @returns {OpenSearchParameter} The parameter of the given type or null
   */
  getParameter(type) {
    return this._parametersByType[type];
  }

  /**
   * Checks whether this URL is compatible with the given parameters
   * @param {object} parameters An object mapping the name or type to the value
   * @returns {boolean} Whether or not the URL is compatible with the given parameters
   */
  isCompatible(parameters) {
    let compatible = true;
    Object.keys(parameters).forEach((key) => {
      if (!Object.prototype.hasOwnProperty.call(this._parametersByType, key)
          && !Object.prototype.hasOwnProperty.call(this._parametersByName, key)) {
        compatible = false;
      }
    });
    if (!compatible) {
      return false;
    }

    if (this.getMissingMandatoryParameters(parameters).length) {
      return false;
    }
    return true;
  }

  /**
   *
   */
  getMissingMandatoryParameters(parameterValues) {
    return this.parameters
      .filter((parameter) => parameter.mandatory)
      .filter((parameter) => isParameterMissing(parameterValues, parameter));
  }

  /**
   *
   */
  getMissingOptionalParameters(parameterValues) {
    return this.parameters
      .filter((parameter) => !parameter.mandatory)
      .filter((parameter) => isParameterMissing(parameterValues, parameter));
  }

  /**
   *
   */
  getUnsupportedParameterKeys(parameters) {
    return Object.keys(parameters).filter((key) => (
      !Object.prototype.hasOwnProperty.call(this._parametersByType, key)
        && !Object.prototype.hasOwnProperty.call(this._parametersByName, key)
    ));
  }

  /**
   * Checks and Serializes the given parameter values to an intermediate form:
   * a list of triplets: parameter name, parameter type, serialized value.
   * @param {object} values The parameter values to serialize
   * @returns {array[]} An array of triplets
   */
  serializeValues(values) {
    Object.keys(values).forEach((key) => {
      if (!Object.prototype.hasOwnProperty.call(this._parametersByType, key)
          && !Object.prototype.hasOwnProperty.call(this._parametersByName, key)) {
        throw new Error(`Invalid parameter '${key}'.`);
      }
    });

    const missingMandatoryParameters = this.getMissingMandatoryParameters(values)
      .map((parameter) => parameter.type);

    if (missingMandatoryParameters.length) {
      throw new Error(`Missing mandatory parameters: ${missingMandatoryParameters.join(', ')}`);
    }
    const serialized = [];
    const { parameters } = this;
    for (let i = 0; i < parameters.length; ++i) {
      const parameter = parameters[i];
      if (parameter.isMulti) {
        const types = parameter.type;
        for (let j = 0; j < types.length; ++j) {
          const type = types[j];
          let value;
          if (Array.isArray(values[parameter.name]) || typeof values[parameter.name] === 'object') {
            value = parameter.serializeValue(values[parameter.name], type);
          } else {
            value = parameter.serializeValue(values, type);
          }
          serialized.push([parameter.name, type, value]);
        }
      } else {
        let value;
        if (Object.prototype.hasOwnProperty.call(values, parameter.name)) {
          value = parameter.serializeValue(values[parameter.name]);
        } else if (Object.prototype.hasOwnProperty.call(values, parameter.type)) {
          value = parameter.serializeValue(values[parameter.type]);
        } else {
          value = '';
        }
        serialized.push([parameter.name, parameter.type, value]);
      }
    }
    return serialized;
  }

  /**
   * Construct a {@link OpenSearchUrl} from a DOMNode
   * @param {DOMNode} node The DOM node from the OpenSearchDescription XML document
   * @returns {OpenSearchUrl} The constructed OpenSearchUrl object
   */
  static fromNode(node) {
    const parameterNodes = getElements(node, 'parameters', 'Parameter');
    const method = getAttributeNS(node, 'parameters', 'method');
    const enctype = getAttributeNS(node, 'parameters', 'enctype');
    const indexOffset = node.hasAttribute('indexOffset')
      ? parseInt(node.getAttribute('indexOffset'), 10) : 1;
    const pageOffset = node.hasAttribute('pageOffset')
      ? parseInt(node.getAttribute('pageOffset'), 10) : 1;
    const rel = node.getAttribute('rel');
    const relations = (!rel || rel === '') ? undefined : rel.split(' ');

    const parsed = parse(node.getAttribute('template'), true);
    const parametersFromTemplate = Object.keys(parsed.query)
      .map((name) => OpenSearchParameter.fromKeyValuePair(name, parsed.query[name]))
      .filter((parameter) => parameter);
    const parametersFromNode = parameterNodes.map(OpenSearchParameter.fromNode);

    const parametersNotInTemplate = parametersFromNode.filter(
      (p1) => !find(parametersFromTemplate, (p2) => p1.name === p2.name)
    ).map((param) => {
      // eslint-disable-next-line no-underscore-dangle, no-param-reassign
      param._mandatory = (typeof param.mandatory === 'undefined') ? true : param.mandatory;
      return param;
    });

    // merge parameters from node and template
    const parameters = parametersFromTemplate.map((p1) => {
      const p2 = find(parametersFromNode, (p) => p1.name === p.name);
      if (p2) {
        return p1.combined(p2);
      }
      return p1;
    }).concat(parametersNotInTemplate);

    return new OpenSearchUrl(
      node.getAttribute('type'),
      node.getAttribute('template'),
      parameters,
      method,
      enctype,
      indexOffset,
      pageOffset,
      relations
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
  static fromTemplateUrl(
    type,
    templateUrl,
    method = 'GET',
    enctype = 'application/x-www-form-urlencoded'
  ) {
    const parsed = parse(templateUrl, true);
    const parameters = Object.keys(parsed.query)
      .map((name) => OpenSearchParameter.fromKeyValuePair(name, parsed.query[name]))
      .filter((parameter) => parameter);
    return new OpenSearchUrl(type, templateUrl, parameters, method, enctype);
  }

  /**
   * Serialize the URL to a simple object.
   * @returns {object} The serialized URL
   */
  serialize() {
    return {
      type: this._type,
      url: this._url,
      method: this._method,
      enctype: this._enctype,
      indexOffset: this._indexOffset,
      pageOffset: this._pageOffset,
      relations: this._relations,
      parameters: this._parameters.map((parameter) => parameter.serialize()),
    };
  }

  /**
   * Deserialize a parameter from a simple object.
   * @param {object} values The serialized URL
   * @returns {OpenSearchUrl} The deserialized URL
   */
  static deserialize(values) {
    return new OpenSearchUrl(
      values.type,
      values.url,
      values.parameters.map((parameterDesc) => OpenSearchParameter.deserialize(parameterDesc)),
      values.method,
      values.enctype,
      values.indexOffset,
      values.pageOffset,
      values.relations
    );
  }
}
