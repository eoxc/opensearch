import { parseXml, getFirstElement, getText } from './utils';

const ows = 'http://www.opengis.net/ows/2.0';

export function getErrorFromXml(xmlStr) {
  const root = parseXml(xmlStr).documentElement;
  const exceptionElement = getFirstElement(root, ows, 'Exception');

  const error = new Error(getText(exceptionElement, ows, 'ExceptionText'));
  error.locator = exceptionElement.getAttribute('locator');
  error.code = exceptionElement.getAttribute('exceptionCode');
  return error;
}
