import parse from 'url-parse';
import { stringify } from 'wellknown';
import { xPathArray, resolver, namespaces, getAttributeNS } from './utils';


const typeRE = /{([a-zA-Z:]+)([?]?)}/;

function parseType(value) {
  const match = typeRE.exec(value);
  if (match) {
    return match[1];
  }
  return null;
}

function isMandatory(value) {
  return typeRE.exec(value)[2] !== '?';
}


/**
 * Class to parse a single URL of an OpenSearchDescription XML document and
 * to create HTTP requests for searches.
 */
export class OpenSearchUrl {
  /**
   * Create an OpenSearchUrl object
   * @param {string} type The mime-type for the content the URL is referring to
   * @param {string} url The URL template or base URL
   * @param {array} parameters The template/request parameters of the URL
   * @param {string} parameters[].name The parameters name
   * @param {string} parameters[].type The parameters type
   * @param {boolean} parameters[].type Whether the parameter is mandatory
   * @param {string} [method='GET'] The HTTP method
   * @param {string} [enctype='application/x-www-form-urlencoded'] The encoding type
   * @returns {OpenSearchUrl} The constructed OpenSearchUrl object
   */
  constructor(type, url, parameters = [], method = 'GET',
              enctype = 'application/x-www-form-urlencoded') {
    this.type = type;
    this.url = url;
    this.method = method;
    this.enctype = enctype;
    this.parameters = parameters;
    this.parametersByName = {};
    this.parametersByType = {};
    parameters.forEach(param => {
      this.parametersByType[param.type] = param;
      this.parametersByName[param.name] = param;
    });
  }

  /**
   * Checks whether this URL is compatible with the given parameters
   * @param {object} parameters An object mapping the name or type to the value
   * @returns {boolean} Whether or not the URL is compatible with the given parameters
   */
  isCompatible(parameters) {
    let compatible = true;
    Object.keys(parameters).forEach(key => {
      if (!this.parametersByType.hasOwnProperty(key)
          && !this.parametersByName.hasOwnProperty(key)) {
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

  serializeParameter(type, value) {
    switch (type) {
      case 'time:start':
      case 'time:end':
        if (value instanceof Date) {
          return value.toISOString();
        }
        break;
      case 'geo:box':
        if (Array.isArray(value)) {
          return value.join(',');
        }
        break;
      case 'geo:geometry':
        return stringify(value);
      default:
        break;
    }
    return value;
  }

  /**
   * Create a request for the given parameters
   * @param {object} parameters An object mapping the name or type to the value
   * @returns {Request} The request object for the fetch function
   */
  createRequest(parameters) {
    // check parameters
    Object.keys(parameters).forEach(key => {
      if (!this.parametersByType.hasOwnProperty(key)
          && !this.parametersByName.hasOwnProperty(key)) {
        throw new Error(`Invalid parameter '${key}'.`);
      }
    });

    const missingMandatoryParameters = this.parameters.filter(
      (parameter) => parameter.mandatory
        && !parameters.hasOwnProperty(parameter.name)
        && !parameters.hasOwnProperty(parameter.type)
    ).map((parameter) => parameter.type);

    const missingOptionalParameters = this.parameters.filter(
      (parameter) => !parameter.mandatory
        && !parameters.hasOwnProperty(parameter.name)
        && !parameters.hasOwnProperty(parameter.type)
    ).map((parameter) => parameter.type);

    if (missingMandatoryParameters.length) {
      throw new Error(`Missing mandatory parameters: ${missingMandatoryParameters.join(', ')}`);
    }

    if (this.method === 'GET') {
      // insert parameters into URL template
      let url = this.url;

      Object.keys(parameters).forEach(key => {
        const type = (this.parametersByType[key] || this.parametersByName[key]).type;
        url = url.replace(
          new RegExp(`{${type}[?]?}`),
          this.serializeParameter(type, parameters[key])
        );
      });

      missingOptionalParameters.forEach(type => {
        url = url.replace(new RegExp(`{${type}[?]?}`), '');
      });

      return new Request(url);
    }

    // for POST
    const formData = new FormData();
    Object.keys(parameters).forEach(key => {
      const type = (this.parametersByType[key] || this.parametersByName[key]).type;
      formData.append(key, this.serializeParameter(type, parameters[key]));
    });
    return new Request(this.url, { method: this.method, body: formData });
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

    if (parameterNodes.length) {
      const parameters = parameterNodes.map((parameterNode) => {
        const type = parseType(parameterNode.getAttribute('value'));
        return {
          name: parameterNode.getAttribute('name'),
          type,
          mandatory: parameterNode.getAttribute('minimum') !== '0',
        };
      });

      return new OpenSearchUrl(
        node.getAttribute('type'), node.getAttribute('template'), parameters,
        method, enctype
      );
    }
    return OpenSearchUrl.fromTemplateUrl(
      node.getAttribute('type'), node.getAttribute('template'),
      method, enctype
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
    const parameters = [];
    const parsed = parse(templateUrl, true);

    Object.keys(parsed.query).forEach(name => {
      const parameterType = parseType(parsed.query[name]);
      if (parameterType) {
        parameters.push({
          name,
          type: parameterType,
          mandatory: isMandatory(parsed.query[name]),
        });
      }
    });
    return new OpenSearchUrl(type, templateUrl, parameters, method, enctype);
  }
}
