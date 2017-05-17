import { parseXml, getFirstElement, getText } from './utils';

/**
 * Try to parse an OWS ExceptionReport and create an Error object from the
 * parsed values.
 * @param {string} xmlStr The XML string to parse the exception from.
 * @returns {Error|null} The parsed error object or null of parsing failed.
 */
export function getErrorFromXml(xmlStr) {
  try {
    const root = parseXml(xmlStr).documentElement;
    const exceptionElement = getFirstElement(root, root.namespaceURI, 'Exception');

    if (!exceptionElement) {
      return null;
    }

    const message = (getText(exceptionElement, exceptionElement.namespaceURI, 'ExceptionText') || '').trim();
    const code = exceptionElement.getAttribute('exceptionCode');
    return new Error(message.length ? message : code);
  } catch (error) {
    return null;
  }
}
