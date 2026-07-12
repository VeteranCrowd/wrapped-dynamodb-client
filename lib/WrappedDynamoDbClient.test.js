/*
******************* DO NOT EDIT THIS NOTICE *****************
This code and all related intellectual property is owned by
Veteran Crowd Rewards, LLC. It is not to be disclosed, copied
or used without written permission.
*************************************************************
*/

/* eslint-env mocha */

// mocha imports
import { expect, use } from 'chai';
import chaiMatchPattern from 'chai-match-pattern';
use(chaiMatchPattern);

// npm imports
import { nanoid } from 'nanoid';
import _ from 'lodash';

// lib imports
import { WrappedDynamoDbClient } from './WrappedDynamoDbClient.js';
import { TransactionCanceledException } from '@aws-sdk/client-dynamodb';

const baseClient = new WrappedDynamoDbClient();
const tableOptions = {
  AttributeDefinitions: [
    { AttributeName: 'entityPK', AttributeType: 'S' },
    { AttributeName: 'entitySK', AttributeType: 'N' },
  ],
  BillingMode: 'PAY_PER_REQUEST',
  KeySchema: [
    { AttributeName: 'entityPK', KeyType: 'HASH' },
    { AttributeName: 'entitySK', KeyType: 'RANGE' },
  ],
};

describe('WrappedDynamoDbClient', function () {
  describe('constructor', function () {
    it('should create a WrappedDynamoDbClient instance', function () {
      expect(baseClient).to.be.an.instanceof(WrappedDynamoDbClient);
    });
  });

  describe('purgeItems', function () {
    it('should bound purges by cutoff and continue filtered pagination', async function () {
      const client = new WrappedDynamoDbClient();
      const scans = [];
      const deletes = [];
      const pages = [
        { Items: [], LastEvaluatedKey: { entityPK: 'a', entitySK: 1 } },
        {
          Items: [{ entityPK: 'old', entitySK: 0, created: 1 }],
          LastEvaluatedKey: undefined,
        },
        { Items: [], LastEvaluatedKey: undefined },
      ];

      client.scan = async (tableName, options) => {
        scans.push({ tableName, options });
        return pages.shift();
      };

      client.deleteItems = async (tableName, keys) => {
        deletes.push({ tableName, keys });
        return [];
      };

      const purged = await client.purgeItems('table', ['entityPK', 'entitySK'], {
        cutoffAttribute: 'created',
        cutoffValue: 2,
      });

      expect(purged).to.equal(1);
      expect(scans).to.have.length(3);
      expect(scans[0].options).to.include({
        FilterExpression: '(attribute_not_exists(#cutoff) OR #cutoff <= :cutoff)',
      });
      expect(scans[0].options.ExpressionAttributeNames).to.deep.equal({
        '#cutoff': 'created',
      });
      expect(scans[0].options.ExpressionAttributeValues).to.deep.equal({
        ':cutoff': 2,
      });
      expect(scans[1].options.ExclusiveStartKey).to.deep.equal({
        entityPK: 'a',
        entitySK: 1,
      });
      expect(deletes).to.deep.equal([
        { tableName: 'table', keys: [{ entityPK: 'old', entitySK: 0 }] },
      ]);
    });
  });

  describe('tables', function () {
    describe('validations', function () {
      it('create/delete should close', async function () {
        const tableName = nanoid();

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
        tableName = nanoid();

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
            const entityPK = nanoid();
            const item = { entityPK, entitySK: 0 };

            // Put item.
            let response = await baseClient.putItem(tableName, item);
            expect(response.$metadata.httpStatusCode).to.equal(200);

            // Delete item.
            response = await baseClient.deleteItem(tableName, item);
            expect(response.$metadata.httpStatusCode).to.equal(200);
          });

          it('puts/deletes should close', async function () {
            const entityPK = nanoid();
            const items = _.range(26).map((entitySK) => ({
              entityPK,
              entitySK,
            }));

            // Put items.
            let response = await baseClient.putItems(tableName, items);
            expect(_.every(response, (r) => r.$metadata.httpStatusCode === 200))
              .to.be.true;

            // Query items.
            response = await baseClient.query(tableName, {
              KeyConditionExpression: '#PK = :PK',
              ExpressionAttributeNames: { '#PK': 'entityPK' },
              ExpressionAttributeValues: { ':PK': entityPK },
            });
            expect(response.Items).not.to.be.empty;

            // Delete items.
            response = await baseClient.deleteItems(tableName, items);
            expect(_.every(response, (r) => r.$metadata.httpStatusCode === 200))
              .to.be.true;

            // Query items.
            response = await baseClient.query(tableName, {
              KeyConditionExpression: '#PK = :PK',
              ExpressionAttributeNames: { '#PK': 'entityPK' },
              ExpressionAttributeValues: { ':PK': entityPK },
            });
            expect(response.Items).to.be.empty;
          });

          it('puts/purge should close', async function () {
            const entityPK = nanoid();
            const n = 26;

            const items = _.range(n).map((entitySK) => ({
              entityPK,
              entitySK,
            }));

            // Put items.
            let response = await baseClient.putItems(tableName, items);
            expect(_.every(response, (r) => r.$metadata.httpStatusCode === 200))
              .to.be.true;

            // Query items.
            response = await baseClient.query(tableName, {
              KeyConditionExpression: '#PK = :PK',
              ExpressionAttributeNames: { '#PK': 'entityPK' },
              ExpressionAttributeValues: { ':PK': entityPK },
            });
            expect(response.Items).not.to.be.empty;

            // Purge items.
            const purged = await baseClient.purgeItems(tableName, [
              'entityPK',
              'entitySK',
            ]);
            expect(purged).to.equal(n);

            // Query items.
            response = await baseClient.query(tableName, {
              KeyConditionExpression: '#PK = :PK',
              ExpressionAttributeNames: { '#PK': 'entityPK' },
              ExpressionAttributeValues: { ':PK': entityPK },
            });
            expect(response.Items).to.be.empty;
          });

          it('purge with cutoff should preserve newer items', async function () {
            const entityPK = nanoid();
            const cutoffValue = Date.now();
            const oldItem = { entityPK, entitySK: 0, created: cutoffValue - 1 };
            const missingCutoffItem = { entityPK, entitySK: 1 };
            const newItem = { entityPK, entitySK: 2, created: cutoffValue + 1 };

            // Put items.
            let response = await baseClient.putItems(tableName, [
              oldItem,
              missingCutoffItem,
              newItem,
            ]);
            expect(_.every(response, (r) => r.$metadata.httpStatusCode === 200))
              .to.be.true;

            // Purge items at cutoff.
            const purged = await baseClient.purgeItems(
              tableName,
              ['entityPK', 'entitySK'],
              { cutoffAttribute: 'created', cutoffValue },
            );
            expect(purged).to.equal(2);

            // Query items.
            response = await baseClient.query(tableName, {
              KeyConditionExpression: '#PK = :PK',
              ExpressionAttributeNames: { '#PK': 'entityPK' },
              ExpressionAttributeValues: { ':PK': entityPK },
            });
            expect(response.Items.map(({ entitySK }) => entitySK)).to.deep.equal(
              [2],
            );

            // Delete remaining item.
            response = await baseClient.deleteItem(tableName, newItem);
            expect(response.$metadata.httpStatusCode).to.equal(200);
          });

          it('transactPuts/transactDeletes should close', async function () {
            const entityPK = nanoid();
            const items = _.range(26).map((entitySK) => ({
              entityPK,
              entitySK,
            }));

            // Put items.
            let response = await baseClient.transactPutItems(tableName, items);
            expect(response.$metadata.httpStatusCode).to.equal(200);

            // Query items.
            response = await baseClient.query(tableName, {
              KeyConditionExpression: '#PK = :PK',
              ExpressionAttributeNames: { '#PK': 'entityPK' },
              ExpressionAttributeValues: { ':PK': entityPK },
            });
            expect(response.Items).not.to.be.empty;

            // Delete items.
            response = await baseClient.transactDeleteItems(tableName, items);
            expect(response.$metadata.httpStatusCode).to.equal(200);

            // Query items.
            response = await baseClient.query(tableName, {
              KeyConditionExpression: '#PK = :PK',
              ExpressionAttributeNames: { '#PK': 'entityPK' },
              ExpressionAttributeValues: { ':PK': entityPK },
            });
            expect(response.Items).to.be.empty;
          });

          it('transactPuts with attribute_not_exists should succeed only once', async function () {
            const entityPK = nanoid();
            const items = _.range(26).map((entitySK) => ({
              entityPK,
              entitySK,
            }));

            const conditionExpressions = items.map((item) => ({
              expression: 'attribute_not_exists(entityPK)',
              entityPK: item.entityPK,
              entitySK: item.entitySK,
            }));

            // First transaction should succeed because the items don't exist.
            const response = await baseClient.transactPutItems(
              tableName,
              items,
              conditionExpressions,
            );

            expect(response.$metadata.httpStatusCode).to.equal(200);

            // Second transaction should fail because the items already exist.
            try {
              await baseClient.transactPutItems(
                tableName,
                items,
                conditionExpressions,
              );

              expect.fail(
                'Expected TransactionCanceledException to be thrown.',
              );
            } catch (error) {
              expect(error).to.be.an.instanceof(TransactionCanceledException);

              if (error instanceof TransactionCanceledException) {
                error.CancellationReasons.forEach((reason) => {
                  expect(reason.Code).to.equal('ConditionalCheckFailed');
                });
              }
            }
          });
        });

        describe('put ... delete', function () {
          let entityPK;
          let item0;
          let item1;

          beforeEach(async function () {
            entityPK = nanoid();
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
