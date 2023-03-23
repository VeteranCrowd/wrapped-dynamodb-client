/* eslint-env mocha */

// mocha imports
import chai from 'chai';
import chaiMatchPattern from 'chai-match-pattern';
chai.use(chaiMatchPattern);
const expect = chai.expect;

// npm imports
import { v4 as uuid } from 'uuid';

// lib imports
import { WrappedDynamoDbClient } from './WrappedDynamoDbClient.js';

const baseClient = new WrappedDynamoDbClient();
const tableOptions = {
  AttributeDefinitions: [
    { AttributeName: 'entityPK', AttributeType: 'S' },
    { AttributeName: 'entitySK', AttributeType: 'N' },
  ],
  KeySchema: [
    { AttributeName: 'entityPK', KeyType: 'HASH' },
    { AttributeName: 'entitySK', KeyType: 'RANGE' },
  ],
  ProvisionedThroughput: {
    ReadCapacityUnits: 1,
    WriteCapacityUnits: 1,
  },
};

describe('WrappedDynamoDbClient', function () {
  describe('constructor', function () {
    it('should create a WrappedDynamoDbClient instance', function () {
      expect(baseClient).to.be.an.instanceof(WrappedDynamoDbClient);
    });
  });

  describe('tables', function () {
    describe('validations', function () {
      it('create/delete should close', async function () {
        const tableName = uuid();

        // Create table.
        let response = await baseClient.createTable(tableName, tableOptions);

        expect(response.state).to.equal('SUCCESS');

        // Delete table.
        response = await baseClient.deleteTable(tableName);

        expect(response.state).to.equal('SUCCESS');
      });
    });

    describe('create ... delete', function () {
      let tableName;

      before(async function () {
        tableName = uuid();

        // Create table.
        await baseClient.createTable(tableName, tableOptions);
      });

      after(async function () {
        // Delete table.
        await baseClient.deleteTable(tableName);
      });

      describe('items', function () {
        describe('validations', function () {
          it('put/delete should close', async function () {
            const entityPK = uuid();
            const item = { entityPK };

            // Put item.
            let response = await baseClient.putItem(tableName, item);
            expect(response.$metadata.httpStatusCode).to.equal(200);

            // Delete item.
            response = await baseClient.deleteItem(tableName, item);
            expect(response.$metadata.httpStatusCode).to.equal(200);
          });
        });

        describe('put ... delete', function () {
          let entityPK;
          let item0;
          let item1;

          beforeEach(async function () {
            entityPK = uuid();
            item0 = { entityPK, entitySK: 0 };
            item1 = { entityPK, entitySK: 1 };

            // Put items.
            await baseClient.putItem(tableName, item0);
            await baseClient.putItem(tableName, item1);
          });

          afterEach(async function () {
            // Delete items.
            await baseClient.deleteItem(tableName, item0);
            await baseClient.deleteItem(tableName, item1);
          });

          describe('get', function () {
            it('should get items', async function () {
              // Get item.
              let response = await baseClient.getItem(tableName, item0);
              expect(response).to.deep.equal(item0);

              response = await baseClient.getItem(tableName, item1);
              expect(response).to.deep.equal(item1);
            });
          });

          describe('query', function () {
            it('should query all items', async function () {
              // Query items.
              const response = await baseClient.query(tableName, {
                KeyConditionExpression: '#PK = :PK',
                ExpressionAttributeNames: { '#PK': 'entityPK' },
                ExpressionAttributeValues: { ':PK': entityPK },
              });

              expect(response.Items).to.deep.equal([item0, item1]);
            });

            it('should return paged result', async function () {
              // Query first page.
              let response = await baseClient.query(tableName, {
                KeyConditionExpression: '#PK = :PK',
                ExpressionAttributeNames: { '#PK': 'entityPK' },
                ExpressionAttributeValues: { ':PK': entityPK },
                Limit: 1,
              });

              expect(response.Items).to.deep.equal([item0]);

              // Query second page.
              response = await baseClient.query(tableName, {
                KeyConditionExpression: '#PK = :PK',
                ExpressionAttributeNames: { '#PK': 'entityPK' },
                ExpressionAttributeValues: { ':PK': entityPK },
                Limit: 1,
                ExclusiveStartKey: response.LastEvaluatedKey,
              });

              expect(response.Items).to.deep.equal([item1]);
            });
          });
        });
      });
    });
  });
});
