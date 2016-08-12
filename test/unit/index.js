import { expect } from 'chai';
import { discover } from '../../src/index.js';
require('es6-promise').polyfill();

import fetchMock from 'fetch-mock';

const osddExample = require('./data/OSDD_example.xml');
const atomExample = require('./data/atom_example.xml');

describe('discover', () => {
  before(() => {
    fetchMock
      .mock('^http://example.com/?q=', atomExample)
      .mock('http://example.com/', osddExample);
  });
  after(() => {
    fetchMock.restore();
  });

  it('discover shall work', () => discover('http://example.com/').then(service => {
    expect(service).to.exist;
    expect(service.descriptionDocument).to.exist;
  }));
});
