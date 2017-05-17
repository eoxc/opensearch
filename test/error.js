import { expect } from 'chai';

import { getErrorFromXml } from '../src/error';

const errorXml = `<?xml version="1.0" encoding="UTF-8"?><ows:ExceptionReport xmlns:ows="http://www.opengis.net/ows/2.0" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" version="1.0.0" xml:lang="en" xsi:schemaLocation="http://www.opengis.net/ows/2.0 http://schemas.opengis.net/ows/2.0/owsExceptionReport.xsd">
<ows:Exception exceptionCode="InvalidParameterValue" locator="httpAccept">
<ows:ExceptionText>MIME type {xapplication/atom+xml} is not supported for dataset series {EOP:CODE-DE:S1_SAR_L1_GRD}.</ows:ExceptionText>
</ows:Exception>
</ows:ExceptionReport>`;

describe('error.js', () => {
  describe('getErrorFromXml()', () => {
    it('shall correctly parse an OWS exception report', () => {
      const error = getErrorFromXml(errorXml);
      const expectedError = new Error('MIME type {xapplication/atom+xml} is not supported for dataset series {EOP:CODE-DE:S1_SAR_L1_GRD}.');
      expect(error).to.deep.equal(expectedError);
    });
  });
});
