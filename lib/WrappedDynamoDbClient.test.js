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
        let response = await baseClient.createTable(tableName, {
          AttributeDefinitions: [
            { AttributeName: 'entityPK', AttributeType: 'S' },
          ],
          KeySchema: [{ AttributeName: 'entityPK', KeyType: 'HASH' }],
          ProvisionedThroughput: {
            ReadCapacityUnits: 1,
            WriteCapacityUnits: 1,
          },
        });

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
        await baseClient.createTable(tableName, {
          AttributeDefinitions: [
            { AttributeName: 'entityPK', AttributeType: 'S' },
          ],
          KeySchema: [{ AttributeName: 'entityPK', KeyType: 'HASH' }],
          ProvisionedThroughput: {
            ReadCapacityUnits: 1,
            WriteCapacityUnits: 1,
          },
        });
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
          let item;

          beforeEach(async function () {
            entityPK = uuid();
            item = { entityPK };

            // Put item.
            await baseClient.putItem(tableName, item);
          });

          afterEach(async function () {
            await baseClient.deleteItem(tableName, item);
          });

          describe('get', function () {
            it('should get an item', async function () {
              // Get item.
              const response = await baseClient.getItem(tableName, item);
              expect(response.Item).to.deep.equal(item);
            });
          });
        });
      });
    });
  });
});
