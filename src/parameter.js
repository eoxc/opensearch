import parse from 'url-parse';
import { stringify } from 'wellknown';
import { xPathArray, resolver, isNullOrUndefined } from './utils';


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
 * Parse a template URL string and get a list of parameters.
 * @param {string} templateUrl the string to parse the parameters from.
 * @returns {OpenSearchParameter[]} the parsed parameters objects
 */
export function parseTemplateParameters(templateUrl) {
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
 * Class to describe a single OpenSearch URL parameter.
 */
export class OpenSearchParameter {
  /**
   * Class to describe a single OpenSearch URL parameter.
   * @param {string} type The type of the parameter
   * @param {string} name The name of the parameter
   * @param {boolean} mandatory Whether the parameter is mandatory
   * @param {object[]} [options=null] The possible values for this parameter
   * @param {string} options[].label The label of the option
   * @param {string} options[].value The value of the option
   * @param {Number} [minExclusive=undefined] The minimum value allowed for this parameter (exclusive)
   * @param {Number} [maxExclusive=undefined] The maximum value allowed for this parameter (exclusive)
   * @param {Number} [minInclusive=undefined] The minimum value allowed for this parameter (inclusive)
   * @param {Number} [maxInclusive=undefined] The maximum value allowed for this parameter (inclusive)
   */
  constructor(type, name, mandatory, options = null,
              minExclusive = undefined, maxExclusive = undefined,
              minInclusive = undefined, maxInclusive = undefined) {
    this._type = type;
    this._name = name;
    this._mandatory = mandatory;
    this._options = options;
    this._minExclusive = minExclusive;
    this._maxExclusive = maxExclusive;
    this._minInclusive = minInclusive;
    this._maxInclusive = maxInclusive;
  }

  /**
   * The type of the parameter
   * @readonly
   */
  get type() {
    return this._type;
  }

  /**
   * The name of the parameter
   * @readonly
   */
  get name() {
    return this._name;
  }

  /**
   * Whether the parameter is mandatory
   * @readonly
   */
  get mandatory() {
    return this._mandatory;
  }

  /**
   * The possible values for this parameter
   * @readonly
   */
  get options() {
    return this._options;
  }

  /**
   * The minimum value allowed for this parameter (exclusive)
   * @readonly
   */
  get minExclusive() {
    return this._minExclusive;
  }

  /**
   * The maximum value allowed for this parameter (exclusive)
   * @readonly
   */
  get maxExclusive() {
    return this._maxExclusive;
  }

  /**
   * The minimum value allowed for this parameter (inclusive)
   * @readonly
   */
  get minInclusive() {
    return this._minInclusive;
  }

  /**
   * The maximum value allowed for this parameter (inclusive)
   * @readonly
   */
  get maxInclusive() {
    return this._maxInclusive;
  }

  /**
   * Combines this parameter with the values of another parameter.
   * @param {OpenSearchParameter} other the other parameter
   * @returns {OpenSearchParameter} the combined parameter
   */
  combined(other) {
    return new OpenSearchParameter(
      this.type, this.name,
      isNullOrUndefined(this.mandatory) ? other.mandatory : this.mandatory,
      isNullOrUndefined(this.options) ? other.options : this.options,
      isNullOrUndefined(this.minExclusive) ? other.minExclusive : this.minExclusive,
      isNullOrUndefined(this.maxExclusive) ? other.maxExclusive : this.maxExclusive,
      isNullOrUndefined(this.minInclusive) ? other.minInclusive : this.minInclusive,
      isNullOrUndefined(this.maxInclusive) ? other.maxInclusive : this.maxInclusive
    );
  }

  /**
   * Serialize the given value according to the internal type to be sent in a
   * request.
   * @param {Number|string|Date|array|object} value The value to serialize. The
   *                                                allowed types depend on the
   *                                                internal type.
   * @returns {string} the serialized value.
   */
  serialize(value) {
    switch (this.type) {
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
   * Constructs a new OpenSearchParameter from a DOM-Node.
   * @param {DOMNode} node the node to create the parameter from.
   * @returns {OpenSearchParameter} the constructed parameters object.
   */
  static fromNode(node) {
    const type = parseType(node.getAttribute('value'));
    const name = node.getAttribute('name');
    const mandatory = node.hasAttribute('minimum')
                        ? node.getAttribute('minimum') !== '0' : undefined;
    const minExclusive = node.hasAttribute('minExclusive')
                          ? parseInt(node.getAttribute('minExclusive')) : null;
    const maxExclusive = node.hasAttribute('maxExclusive')
                          ? parseInt(node.getAttribute('maxExclusive')) : null;
    const minInclusive = node.hasAttribute('minInclusive')
                          ? parseInt(node.getAttribute('minInclusive')) : null;
    const maxInclusive = node.hasAttribute('maxInclusive')
                          ? parseInt(node.getAttribute('maxInclusive')) : null;
    const optionNodes = xPathArray(node, 'parameters:Option', resolver);
    let options;
    if (optionNodes.length) {
      options = optionNodes.map(optionNode => ({
        label: optionNode.getAttribute('label'),
        value: optionNode.getAttribute('value'),
      }));
    }
    return new OpenSearchParameter(
      name, type, mandatory, options, minExclusive, maxExclusive, minInclusive, maxInclusive
    );
  }
}
