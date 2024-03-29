/**
 * @module wrapped-dynamodb-client
 */

// npm imports
import AWSXray from 'aws-xray-sdk';
import {
  DynamoDB,
  waitUntilTableExists,
  waitUntilTableNotExists,
} from '@aws-sdk/client-dynamodb';
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';
import _ from 'lodash';
import { setTimeout } from 'timers/promises';

const defaultConfig = { region: 'us-east-1' };

/**
 * Wraps an AWS DynamoDB client to provide standard logging & services.
 */
export class WrappedDynamoDbClient {
  #client;
  #doc;
  #logger;

  /**
   * WrappedDynamoDbClient constructor.
   *
   * @param {object} [options] - Options.
   * @param {object} [options.logger] - Logger instance (default is {@link https://nodejs.org/api/console.html#class-console global console object}). Must have info, error & debug methods
   * @param {boolean} [options.logInternals] - Log AWS client internals (default is false).
   * @param {object} [options.config] - {@link https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-dynamodb/interfaces/dynamodbclientconfig.html DynamoDBClientConfig} object.
   */
  constructor({
    config = defaultConfig,
    logger = console,
    logInternals = false,
  } = {}) {
    // Validate options.
    if (!logger.info || !logger.error || !logger.debug)
      throw new Error('logger must have info, error & debug methods');

    // Set state.
    this.#logger = logger;

    const ddb = new DynamoDB({
      ..._.omit(config, 'logger'),
      ...(logInternals ? { logger } : {}),
    });

    this.#client = process.env.AWS_XRAY_DAEMON_ADDRESS
      ? AWSXray.captureAWSv3Client(ddb)
      : ddb;

    this.#doc = DynamoDBDocument.from(this.#client, {
      marshallOptions: { removeUndefinedValues: true },
    });
  }

  /**
   * Validate attribute list.
   *
   * @param {string} input - Attribute list.
   * @return {boolean} True if valid.
   * @private
   */
  #validateAttributeList(input) {
    return this.#validateParam(
      'attribute list',
      input,
      (input) =>
        _.isNil(input) ||
        ((_.isString(input) || _.isArray(input)) && input.length)
    );
  }

  /**
   * Validate a CreateTableCommandInput.
   *
   * @param {object} input - {@link https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-dynamodb/interfaces/createtablecommandinput.html CreateTableCommandInput} object.
   * @return {boolean} True if valid.
   * @private
   */
  #validateCreateTableCommandInput(input) {
    return this.#validateParam('CreateTableCommandInput', input, (input) =>
      _.isPlainObject(input)
    );
  }

  /**
   * Validate an item.
   *
   * @param {object} input - Item object.
   * @return {boolean} True if valid.
   * @private
   */
  #validateItem(input) {
    return this.#validateParam('item', input, (input) =>
      _.isPlainObject(input)
    );
  }

  /**
   * Validate an item object array.
   *
   * @param {object[]} input - Item object array.
   * @return {boolean} True if valid.
   * @private
   */
  #validateItems(input) {
    return this.#validateParam(
      'item array',
      input,
      (input) =>
        _.isArray(input) && _.every(input, (item) => _.isPlainObject(item))
    );
  }

  /**
   * Validate function parameter.
   *
   * @param {string} name - Parameter name.
   * @param {*} value - Parameter value.
   * @param {Function} validator - Validator function.
   * @return {boolean} True if valid.
   * @private
   */
  #validateParam(name, value, validator) {
    if (!validator(value)) {
      const message = `invalid ${name}`;
      this.#logger.error(message, value);
      throw new Error({ message, value });
    } else return true;
  }

  /**
   * Validate a QueryCommandInput.
   *
   * @param {object} input - {@link https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-dynamodb/interfaces/querycommandinput.html QueryCommandInput} object.
   * @return {boolean} True if valid.
   * @private
   */
  #validateQueryCommandInput(input) {
    return this.#validateParam('QueryCommandInput', input, (input) =>
      _.isPlainObject(input)
    );
  }

  /**
   * Validate a table name.
   *
   * @param {string} input - Table name.
   * @return {boolean} True if valid.
   * @private
   */
  #validateTableName(input) {
    return this.#validateParam(
      'tableName',
      input,
      (input) => _.isString(input) && input.length
    );
  }

  /**
   * Create a DynamoDB table.
   *
   * @param {string} tableName - Table name.
   * @param {object} [options] - {@link https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-dynamodb/interfaces/createtablecommandinput.html CreateTableCommandInput} object.
   * @return {Promise<object>} {@link https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-dynamodb/globals.html#waiterresult WaiterResult} object.
   * @category table
   */
  async createTable(tableName, options = {}) {
    // Validate arguments.
    this.#validateTableName(tableName);
    this.#validateCreateTableCommandInput(options);

    // Send command.
    this.#logger.debug(`Creating table ${tableName}...`, options);
    try {
      var response = await this.#client.createTable({
        ...options,
        TableName: tableName,
      });
      if (!response.TableDescription?.TableStatus) throw new Error(response);
      this.#logger.info(`Table ${tableName} creation requested.`);
      this.#logger.debug(response);
    } catch (error) {
      this.#logger.error(`Table ${tableName} creation request failed.`, error);
      throw new Error(error);
    }

    // Await table creation.
    this.#logger.info(`Awaiting table ${tableName} creation...`);
    try {
      response = await waitUntilTableExists(
        { client: this.#client, maxWaitTime: 60 },
        { TableName: tableName }
      );
    } catch (error) {
      this.#logger.error(`Table ${tableName} creation failed.`, error);
      throw new Error(error);
    }
    this.#logger.info(`Table ${tableName} created.`);
    this.#logger.debug(response);

    return response;
  }

  /**
   * Delete an item from a DynamoDB table.
   *
   * @param {string} tableName - Table name.
   * @param {object} key - Item object (only the key is required).
   * @return {Promise<object>} {@link https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-dynamodb/globals.html#waiterresult WaiterResult} object.
   * @category item
   */
  async deleteItem(tableName, key) {
    // Validate arguments.
    this.#validateTableName(tableName);
    this.#validateItem(key);

    // Send command.
    this.#logger.debug(`Deleting item from table ${tableName}...`, key);
    try {
      var response = await this.#doc.delete({
        TableName: tableName,
        Key: key,
      });
      this.#logger.debug(`Deleted item from table ${tableName}.`, response);
      return response;
    } catch (error) {
      this.#logger.error(
        `Failed to delete item from table ${tableName}.`,
        response
      );
      throw new Error(error);
    }
  }

  /**
   * Delete multiple items from a DynamoDB table.
   *
   * @param {string} tableName - Table name.
   * @param {object[]} keys - Array of item objects (only the key is required).
   * @return {Promise<number>} Array of responses from chunked batchWrite operations.
   * @category item
   */
  async deleteItems(tableName, keys) {
    this.#validateTableName(tableName);
    this.#validateItems(keys);

    const chunks = _.chunk(keys, 25);
    const initialDelay = 100;

    const results = (
      await Promise.allSettled(
        chunks.map(async (chunk) => {
          let delay = 0;

          while (chunk.length) {
            if (delay) await setTimeout(delay);

            this.#logger.debug(
              `Deleting items from table ${tableName}...`,
              chunk
            );

            const requests = chunk.map((key) => ({
              DeleteRequest: { Key: key },
            }));

            var response = await this.#doc.batchWrite({
              RequestItems: { [tableName]: requests },
            });

            chunk = response?.UnprocessedItems?.[tableName] ?? [];
            if (chunk.length) {
              this.#logger.debug(
                `${chunk.length} items not processed...`,
                chunk
              );
              delay = delay ? delay * 2 : initialDelay;
            }
          }

          return response;
        })
      )
    ).map(({ status, value, reason }) =>
      status === 'fulfilled' ? value : reason
    );

    this.#logger.debug(`Deleted items from table ${tableName}.`, results);

    return results;
  }

  /**
   * Delete a DynamoDB table.
   *
   * @param {string} tableName - Table name.
   * @return {Promise<object>} - Deletion status
   * @category table
   */
  async deleteTable(tableName) {
    this.#validateTableName(tableName);

    // Send command.
    this.#logger.info(`Deleting table ${tableName}...`);
    try {
      var response = await this.#client.deleteTable({ TableName: tableName });
      this.#logger.info(`Table ${tableName} deletion requested.`);
      this.#logger.debug(response);
    } catch (error) {
      this.#logger.error(`Table ${tableName} deletion request failed.`, error);
      throw new Error(error);
    }

    // Await table deletion.
    this.#logger.info(`Awaiting table ${tableName} deletion...`);
    try {
      response = await waitUntilTableNotExists(
        { client: this.#client, maxWaitTime: 60 },
        { TableName: tableName }
      );
    } catch (error) {
      this.#logger.error(`Table ${tableName} deletion failed.`, error);
      throw new Error(error);
    }
    this.#logger.info(`Table ${tableName} deleted.`);
    this.#logger.debug(response);

    return response;
  }

  /**
   * Describe a DynamoDB table.
   *
   * @param {string} tableName - Table name.
   * @return {Promise<object>} - {@link https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-dynamodb/interfaces/tabledescription-5.html TableDescription}}
   * @category table
   */
  async describeTable(tableName) {
    this.#validateTableName(tableName);

    // Send command.
    this.#logger.info(`Describing table ${tableName}...`);
    try {
      var response = await this.#client.describeTable({ TableName: tableName });
      this.#logger.info(`Table ${tableName} description requested.`);
      this.#logger.debug(response);

      return response.Table;
    } catch (error) {
      this.#logger.error(
        `Table ${tableName} description request failed.`,
        error
      );
      throw new Error(error);
    }
  }

  /**
   * Get an item from a DynamoDB table.
   *
   * @param {string} tableName - Table name.
   * @param {object} key - Item object (only the key is required).
   * @param {string|string[]} [attributes] - Comma-delimited list or string array of attributes to retrieve.
   * @return {Promise<object>} - {@link https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-dynamodb/interfaces/getitemcommandoutput.html GetItemCommandOutput} object.
   * @category item
   */
  async getItem(tableName, key, attributes) {
    // Validate arguments.
    this.#validateTableName(tableName);
    this.#validateItem(key);
    this.#validateAttributeList(attributes);

    // Process attributes.
    if (_.isString(attributes)) attributes = attributes.split(/,\s*/);
    if (attributes?.length) {
      var expressionAttributeNames = attributes.reduce(
        (expressionAttributeNames, attribute) => ({
          ...expressionAttributeNames,
          [`#${attribute}`]: attribute,
        }),
        {}
      );

      var projectionExpression = attributes
        .map((attribute) => `#${attribute}`)
        .join(',');
    }

    // Send command.
    this.#logger.debug(`Getting item from table ${tableName}...`, key);
    try {
      var response = await this.#doc.get({
        TableName: tableName,
        ...(expressionAttributeNames
          ? { ExpressionAttributeNames: expressionAttributeNames }
          : {}),
        Key: key,
        ...(projectionExpression
          ? { ProjectionExpression: projectionExpression }
          : {}),
      });

      this.#logger.debug(`Got item from table ${tableName}.`, response);

      return response?.Item;
    } catch (error) {
      this.#logger.error(
        `Failed to get item from table ${tableName}.`,
        response
      );
      throw new Error(error);
    }
  }

  /**
   * Purge all items from a DynamoDB table.
   *
   * @param {string} tableName - Table name.
   * @param {string[]} keys - Item keys.
   * @return {Promise<number>} Total items purged from table.
   * @category item
   */
  async purgeItems(tableName, keys) {
    this.#validateTableName(tableName);

    this.#validateParam(
      'keys',
      keys,
      (keys) =>
        _.isArray(keys) && keys.length && keys.every((key) => _.isString(key))
    );

    this.#logger.debug(`Purging DynamoDB table '${tableName}'...`);

    let purged = 0;
    do {
      var { Items: items, LastEvaluatedKey: lastEvaluatedKey } =
        await this.scan(
          tableName,
          lastEvaluatedKey ? { ExclusiveStartKey: lastEvaluatedKey } : {}
        );

      if (items.length) {
        const itemKeys = items.map((item) => _.pick(item, keys));

        await this.deleteItems(tableName, itemKeys);

        purged += items.length;

        this.#logger.debug(`  Purged ${purged} items.`);
      }
    } while (items.length);

    this.#logger.debug(`Done.\n`);

    return purged;
  }

  /**
   * Put an item into a DynamoDB table.
   *
   * @param {string} tableName - Table name.
   * @param {object} item - Item object.
   * @return {Promise<object>} - {@link https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-dynamodb/interfaces/putitemcommandoutput.html PutItemCommandOutput} object.
   * @category item
   */
  async putItem(tableName, item) {
    // Validate arguments.
    this.#validateTableName(tableName);
    this.#validateItem(item);

    // Send command.
    this.#logger.debug(`Putting item to table ${tableName}...`, item);
    const response = await this.#doc.put({ TableName: tableName, Item: item });
    if (response.$metadata.httpStatusCode === 200)
      this.#logger.debug(`Put item to table ${tableName}.`, response);
    else
      this.#logger.error(`Failed to put item to table ${tableName}.`, response);

    return response;
  }

  /**
   * Put multiple items into a DynamoDB table.
   *
   * @param {string} tableName - Table name.
   * @param {object[]} items - Array of item objects.
   * @return {Promise<Array>} Array of responses from chunked batchWrite operations.
   * @category item
   */
  async putItems(tableName, items) {
    this.#validateTableName(tableName);
    this.#validateItems(items);

    const chunks = _.chunk(items, 25);
    const initialDelay = 100;

    const results = (
      await Promise.allSettled(
        chunks.map(async (chunk) => {
          let delay = 0;

          while (chunk.length) {
            if (delay) await setTimeout(delay);

            this.#logger.debug(`Putting items to table ${tableName}...`, chunk);

            const requests = chunk.map((item) => ({
              PutRequest: { Item: item },
            }));

            var response = await this.#doc.batchWrite({
              RequestItems: { [tableName]: requests },
            });

            chunk = response?.UnprocessedItems?.[tableName] ?? [];
            if (chunk.length) {
              this.#logger.debug(
                `${chunk.length} items not processed...`,
                chunk
              );
              delay = delay ? delay * 2 : initialDelay;
            }
          }

          return response;
        })
      )
    ).map(({ status, value, reason }) =>
      status === 'fulfilled' ? value : reason
    );

    this.#logger.debug(`Put items to table ${tableName}.`, results);

    return results;
  }

  /**
   * Query items from a DynamoDB table.
   *
   * @param {string} tableName - Table name.
   * @param {object} options - {@link https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-dynamodb/interfaces/querycommandinput.html QueryCommandInput} object.
   * @return {Promise<object>} {@link https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-dynamodb/interfaces/querycommandoutput.html QueryCommandOutput} object.
   * @category item
   */
  async query(tableName, options = {}) {
    // Validate arguments.
    this.#validateTableName(tableName);
    this.#validateQueryCommandInput(options);

    // Send command.
    this.#logger.debug(`Querying table ${tableName}...`, options);
    const response = await this.#doc.query({
      ...options,
      TableName: tableName,
    });
    if (response.$metadata.httpStatusCode === 200)
      this.#logger.debug(`Queried table ${tableName}.`, response);
    else this.#logger.error(`Failed to query table ${tableName}.`, response);

    return response;
  }

  /**
   * Scan items from a DynamoDB table.
   *
   * @param {string} tableName - Table name.
   * @param {object} options - {@link https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-dynamodb/interfaces/scancommandinput.html ScanCommandInput} object.
   * @return {Promise<object>} {@link https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-dynamodb/interfaces/scancommandoutput.html ScanCommandOutput} object.
   * @category item
   */
  async scan(tableName, options = {}) {
    // Validate arguments.
    this.#validateTableName(tableName);
    this.#validateQueryCommandInput(options);

    // Send command.
    this.#logger.debug(`Scanning table ${tableName}...`, options);
    const response = await this.#doc.scan({
      ...options,
      TableName: tableName,
    });
    if (response.$metadata.httpStatusCode === 200)
      this.#logger.debug(`Scanned table ${tableName}.`, response);
    else this.#logger.error(`Failed to query table ${tableName}.`, response);

    return response;
  }

  /**
   * Delete multiple items from a DynamoDB table as a single transaction.
   *
   * @param {string} tableName - Table name.
   * @param {object[]} keys - Array of item keys.
   * @return {Promise<Array>} Array of responses from chunked batchWrite operations.
   * @category item
   */
  async transactDeleteItems(tableName, keys) {
    this.#validateTableName(tableName);
    this.#validateItems(keys);

    this.#logger.debug(
      `Deleting ${keys.length} items in a single transaction from table ${tableName}...`
    );

    const result = await this.#doc.transactWrite({
      TransactItems: keys.map((key) => ({
        Delete: { Key: key, TableName: tableName },
      })),
    });

    this.#logger.debug('Done.');

    return result;
  }

  /**
   * Put multiple items into a DynamoDB table as a single transaction.
   *
   * @param {string} tableName - Table name.
   * @param {object[]} items - Array of item objects.
   * @return {Promise<Array>} Array of responses from chunked batchWrite operations.
   * @category item
   */
  async transactPutItems(tableName, items) {
    this.#validateTableName(tableName);
    this.#validateItems(items);

    this.#logger.debug(
      `Putting ${items.length} items in a single transaction to table ${tableName}...`
    );

    const result = await this.#doc.transactWrite({
      TransactItems: items.map((item) => ({
        Put: { Item: item, TableName: tableName },
      })),
    });

    this.#logger.debug('Done.');

    return result;
  }
}
