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

function parseTemplateParameters(templateUrl) {
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
  return parameters;
}

function eoValueToString(value, isDate = false) {
  const convertDate = (dateValue) => {
    if (dateValue instanceof Date) {
      return dateValue.toISOString();
    }
    return value;
  };

  if (typeof value === 'number') {
    return value.toString();
  } else if (isDate && value instanceof Date) {
    return convertDate(value);
  } else if (Array.isArray(value)) {
    if (isDate) {
      return `{${value.map(convertDate).join(',')}}`;
    }
    return `{${value.join(',')}}`;
  }

  let left = null;
  let right = null;
  if (value.hasOwnProperty('min')) {
    left = `[${isDate ? convertDate(value.min) : value.min}`;
  } else if (value.hasOwnProperty('minExclusive')) {
    left = `]${isDate ? convertDate(value.minExclusive) : value.minExclusive}`;
  }

  if (value.hasOwnProperty('max')) {
    right = `${isDate ? convertDate(value.max) : value.max}]`;
  } else if (value.hasOwnProperty('maxExclusive')) {
    right = `${isDate ? convertDate(value.maxExclusive) : value.maxExclusive}[`;
  }

  if (left !== null && right !== null) {
    return `${left},${right}`;
  } else if (left !== null) {
    return left;
  }
  return right;
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
              enctype = 'application/x-www-form-urlencoded',
              indexOffset = 1, pageOffset = 1) {
    this.type = type;
    this.url = url;
    this.method = method;
    this.enctype = enctype;
    this.indexOffset = indexOffset;
    this.pageOffset = pageOffset;

    this.parameters = parameters;
    this.parametersByName = {};
    this.parametersByType = {};
    parameters.forEach(param => {
      this.parametersByType[param.type] = param;
      this.parametersByName[param.name] = param;
    });
  }

  /**
   * Returns whether the URL has a template parameter of the given type
   * @param {string} type The parameter type to check
   * @returns {boolean} Whether the URL has a parameter of that type
   */
  hasParameter(type) {
    return this.parametersByType.hasOwnProperty(type);
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
      case 'eo:orbitNumber':
      case 'eo:track':
      case 'eo:frame':
      case 'eo:cloudCover':
      case 'eo:snowCover':
      case 'eo:startTimeFromAscendingNode':
      case 'eo:completionTimeFromAscendingNode':
      case 'eo:illuminationAzimuthAngle':
      case 'eo:illuminationZenithAngle':
      case 'eo:illuminationElevationAngle':
      case 'eo:minimumIncidenceAngle':
      case 'eo:maximumIncidenceAngle':
      case 'eo:dopplerFrequency':
      case 'eo:incidenceAngleVariation':
        return eoValueToString(value);
      case 'eo:availabilityTime':
      case 'eo:creationDate':
      case 'eo:modificationDate':
      case 'eo:processingDate':
        return eoValueToString(value, true);
      default:
        break;
    }
    return value;
  }

  /**
   * Create a request for the given parameters
   * @param {object} parameters An object mapping the name or type to the value
   * @returns {Request} The {@link https://developer.mozilla.org/en-US/docs/Web/API/Request Request}
   *                    object for the
   *                    {@link https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API Fetch API}
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
    const enctype = this.enctype || 'application/x-www-form-urlencoded';
    let body = null;
    if (enctype === 'application/x-www-form-urlencoded') {
      body = Object.keys(parameters).map(key => {
        const param = (this.parametersByType[key] || this.parametersByName[key]);
        const k = encodeURIComponent(param.name);
        const v = encodeURIComponent(this.serializeParameter(param.type, parameters[key]));
        return `${k}=${v}`;
      }).join('&');
    } else if (enctype === 'multipart/form-data') {
      body = new FormData();
      Object.keys(parameters).forEach(key => {
        const param = (this.parametersByType[key] || this.parametersByName[key]);
        body.append(param.name, this.serializeParameter(param.type, parameters[key]));
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

    const parametersFromTemplate = parseTemplateParameters(node.getAttribute('template'));
    const parametersFromNode = parameterNodes.map((parameterNode) => {
      const type = parseType(parameterNode.getAttribute('value'));
      const name = parameterNode.getAttribute('name');
      const mandatory = parameterNode.hasAttribute('minimum')
                          ? parameterNode.getAttribute('minimum') !== '0' : undefined;
      const optionNodes = xPathArray(parameterNode, 'parameters:Option', resolver);
      let options;
      if (optionNodes.length) {
        options = optionNodes.map(optionNode => ({
          label: optionNode.getAttribute('label'),
          value: optionNode.getAttribute('value'),
        }));
      }
      return { name, type, mandatory, options };
    });

    const parametersNotInTemplate = parametersFromNode.filter(
      p1 => !parametersFromTemplate.find(p2 => p1.name === p2.name)
    ).map(param => Object.assign(param, {
      mandatory: (typeof param.mandatory === 'undefined') ? true : param.mandatory,
    }));

    // merge parameters from node and template
    const parameters = parametersFromTemplate.map(p1 => {
      const p2 = parametersFromNode.find(p => p1.name === p.name);
      if (p2) {
        return {
          name: p1.name,
          type: p1.type,
          mandatory: (typeof p2.mandatory !== 'undefined') ? p2.mandatory : p1.mandatory,
          options: p2.options,
        };
      }
      return p1;
    }).concat(parametersNotInTemplate);

    return new OpenSearchUrl(
      node.getAttribute('type'), node.getAttribute('template'),
      parameters, method, enctype, indexOffset, pageOffset
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
    const parameters = parseTemplateParameters(templateUrl);
    return new OpenSearchUrl(type, templateUrl, parameters, method, enctype);
  }
}
