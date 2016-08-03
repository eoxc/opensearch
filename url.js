export class OpenSearchUrl {
  constructor(mimeType, url, parameters = [], method = 'GET') {
    this.mimeType = mimeType;
    this.url = url;
    this.method = method;
    this.parameters = parameters;
    this.parametersByName = new Map();
    this.parametersByType = new Map();
    parameters.each(param => {
      this.parametersByType.set(param.type, param);
      this.parametersByName.set(param.name, param);
    });
  }

  static fromNode(node) {
    const url = new OpenSearchUrl(
      node.getAttribute('type'), node.getAttribute('template')
    );
    return url;
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
