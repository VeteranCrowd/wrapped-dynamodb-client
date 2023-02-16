/* eslint-env mocha */

// mocha imports
import chai from 'chai';
import chaiMatchPattern from 'chai-match-pattern';
chai.use(chaiMatchPattern);
const expect = chai.expect;

// lib imports
import { WrappedDynamoDbClient } from './WrappedDynamoDbClient.js';

describe('WrappedDynamoDbClient', function () {
  describe('constructor', function () {
    it('should create a WrappedDynamoDbClient instance', function () {
      const wrappedDynamoDbClient = new WrappedDynamoDbClient();
      expect(wrappedDynamoDbClient).to.be.an.instanceof(WrappedDynamoDbClient);
    });
  });
});
