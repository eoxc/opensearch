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

export class OpenSearchUrl {
  constructor(type, url, parameters = [], method = 'GET', enctype = 'application/x-www-form-urlencoded') {
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
   */
  isCompatible(parameters) {
    for (const key in parameters) {
      if (!this.parametersByType.hasOwnProperty(key)
          && !this.parametersByName.hasOwnProperty(key)) {
        return false;
      }
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
      case 'geo:box':
        if (Array.isArray(value)) {
          return value.join(',');
        }
      case 'geo:geometry':
        return stringify(value);
      default:
        break;
    }
    return value;
  }

  createRequest(parameters) {
    // check parameters
    for (const key in parameters) {
      if (!this.parametersByType.hasOwnProperty(key)
          && !this.parametersByName.hasOwnProperty(key)) {
        throw new Error(`Invalid parameter '${key}'.`);
      }
    }

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
      throw new Error(`Missing mandatory parameters: ${missingMandatoryParameters.join(', ')}`)
    }

    if (this.method === 'GET') {
      // insert parameters into URL template
      let url = this.url;
      for (const key in parameters) {
        if (!parameters.hasOwnProperty(key)) {
          continue;
        }
        const type = (this.parametersByType[key] || this.parametersByName[key]).type;
        url = url.replace(
          new RegExp(`{${type}[?]?}`),
          this.serializeParameter(type, parameters[key])
        );
      }

      missingOptionalParameters.forEach(type => {
        url = url.replace(new RegExp(`{${type}[?]?}`), '');
      });

      return [url];
    }
    const formData = new FormData();
    for (const key in parameters) {
      if (!parameters.hasOwnProperty(key)) {
        continue;
      }
      const type = (this.parametersByType[key] || this.parametersByName[key]).type;
      formData.append(key, this.serializeParameter(type, parameters[key]));
    }
    return [this.url, { method: this.method, body: formData }];
  }

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

  static fromTemplateUrl(type, templateUrl, method = 'GET', enctype = 'application/x-www-form-urlencoded') {
    const parameters = [];
    const parsed = parse(templateUrl, true);

    for (const name in parsed.query) {
      if (!parsed.query.hasOwnProperty(name)) {
        continue;
      }
      const type = parseType(parsed.query[name]);
      if (type) {
        parameters.push({
          name,
          type,
          mandatory: isMandatory(parsed.query[name]),
        });
      }
    }
    return new OpenSearchUrl(type, templateUrl, parameters, method, enctype);
  }
}

export class OpenSearchUrlParameter {
  constructor(name, type, optional = true, options = null) {
    this.name = name;
    this.type = type;
    this.optional = optional;
    this.options = options;
  }
}
