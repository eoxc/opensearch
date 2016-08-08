import parse from 'url-parse';

import { xPathArray } from './utils';


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

function resolver(prefix) {
  if (prefix === 'parameters') {
    return 'http://a9.com/-/spec/opensearch/extensions/parameters/1.0/';
  }
  return null;
}

export class OpenSearchUrl {
  constructor(mimeType, url, parameters = [], method = 'GET', enctype = 'application/x-www-form-urlencoded') {
    this.mimeType = mimeType;
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

  isCompatible(parameters) {

  }

  createRequest(parameters) {
    // check parameters
    for (const key in parameters) {
      if (!this.parametersByType.hasOwnProperty(key)
          && !this.parametersByName.hasOwnProperty(key)) {
        throw new Error(`Invalid parameter '${key}'.'`);
      }
    }

    if (this.method === 'GET') {
      // TODO: insert parameters into URL template
      let url = this.url;
      for (const key in parameters) {
        if (!parameters.hasOwnProperty(key)) {
          continue;
        }
        const type = (this.parametersByType[key] || this.parametersByName[key]).type;
        url = url.replace(new RegExp(`{${type}[?]?}`), parameters[key]);
      }
      return [url];
    }
    const formData = new FormData();
    for (const key in parameters) {
      if (!parameters.hasOwnProperty(key)) {
        continue;
      }
      formData.append(key, parameters[key]);
    }
    return [this.url, { method: this.method, body: formData }];
  }

  static fromNode(node) {
    const parameterNodes = xPathArray(node, 'parameters:Parameter', resolver);
    const method = node.getAttributeNS('http://a9.com/-/spec/opensearch/extensions/parameters/1.0/', 'method');
    const enctype = node.getAttributeNS('http://a9.com/-/spec/opensearch/extensions/parameters/1.0/', 'enctype');

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

  static fromTemplateUrl(mimeType, templateUrl, method = 'GET', enctype = 'application/x-www-form-urlencoded') {
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
    return new OpenSearchUrl(mimeType, templateUrl, parameters, method, enctype);
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
