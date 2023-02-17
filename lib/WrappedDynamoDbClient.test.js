/* eslint-env mocha */

// mocha imports
import chai from 'chai';
import chaiMatchPattern from 'chai-match-pattern';
chai.use(chaiMatchPattern);
const expect = chai.expect;

// npm imports
import { v4 as uuid } from 'uuid';
import retry from 'async-retry';

// lib imports
import { WrappedDynamoDbClient } from './WrappedDynamoDbClient.js';

describe('WrappedDynamoDbClient', function () {
  describe('constructor', function () {
    it('should create a WrappedDynamoDbClient instance', function () {
      const wrappedDynamoDbClient = new WrappedDynamoDbClient();
      expect(wrappedDynamoDbClient).to.be.an.instanceof(WrappedDynamoDbClient);
    });
  });

  describe('create/delete table', function () {
    it('should create & delete a table', async function () {
      const wrappedDynamoDbClient = new WrappedDynamoDbClient();
      const tableName = uuid();

      // Create table.
      let response = await wrappedDynamoDbClient.createTable(tableName, {
        AttributeDefinitions: [
          { AttributeName: 'entityPK', AttributeType: 'S' },
        ],
        KeySchema: [{ AttributeName: 'entityPK', KeyType: 'HASH' }],
        ProvisionedThroughput: {
          ReadCapacityUnits: 1,
          WriteCapacityUnits: 1,
        },
      });

      expect(response.Table.TableStatus).to.equal('ACTIVE');

      // Delete table.
      response = await wrappedDynamoDbClient.deleteTable(tableName);

      expect(response.Table.TableStatus).to.equal('DELETED');
    });
  });
});
