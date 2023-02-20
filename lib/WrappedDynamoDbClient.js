/**
 * @module WrappedDynamoDbClient
 */

// npm imports
import {
  DynamoDB,
  waitUntilTableExists,
  waitUntilTableNotExists,
} from '@aws-sdk/client-dynamodb';
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';
import _ from 'lodash';

/** @type {object} */
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
   * @param {object} [options.config] - {@link https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-dynamodb/interfaces/dynamodbclientconfig.html DynamoDBClientConfig}.
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
    this.#client = new DynamoDB({
      ..._.omit(config, 'logger'),
      ...(logInternals ? { logger } : {}),
    });
    this.#doc = DynamoDBDocument.from(this.#client);
  }

  /**
   * Validate attribute list.
   *
   * @param {string} input - Attribute list.
   * @return {boolean} True if valid.
   */
  #validateAttributeList(input) {
    if (!_.isNil(input) && (!_.isString(input) || !input.length)) {
      const message = 'invalid attribute list';
      this.#logger.error(message, input);
      throw new Error({ message, input });
    } else return true;
  }

  /**
   * Validate a CreateTableCommandInput.
   *
   * @param {object} input - {@link https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-dynamodb/interfaces/createtablecommandinput.html CreateTableCommandInput} object.
   * @return {boolean} True if valid.
   */
  #validateCreateTableCommandInput(input) {
    if (!_.isPlainObject(input)) {
      const message = 'invalid CreateTableCommandInput';
      this.#logger.error(message, input);
      throw new Error({ message, input });
    } else return true;
  }

  /**
   * Validate an item.
   *
   * @param {object} input - Item object.
   * @return {boolean} True if valid.
   */
  #validateItem(input) {
    if (!_.isPlainObject(input)) {
      const message = 'invalid item';
      this.#logger.error(message, input);
      throw new Error({ message, input });
    } else return true;
  }

  /**
   * Validate a table name.
   *
   * @param {string} input - Table name.
   * @return {boolean} True if valid.
   */
  #validateTableName(input) {
    if (!_.isString(input) || !input.length) {
      const message = 'invalid tableName';
      this.#logger.error(message, input);
      throw new Error({ message, input });
    } else return true;
  }

  /**
   * Create a DynamoDB table.
   *
   * @param {string} tableName - Table name.
   * @param {object} [options] - {@link https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-dynamodb/interfaces/createtablecommandinput.html CreateTableCommandInput}.
   * @return {object} {@link https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-dynamodb/globals.html#waiterresult WaiterResult}
   */
  async createTable(tableName, options = {}) {
    // Validate arguments.
    this.#validateTableName(tableName);
    this.#validateCreateTableCommandInput(options);

    // Send command.
    this.#logger.debug(`Creating table ${tableName}...`, options);
    try {
      var response = await this.#client.createTable({
        TableName: tableName,
        ...options,
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
   * @return {object} {@link https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-dynamodb/globals.html#waiterresult WaiterResult}
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
   * Delete a DynamoDB table.
   *
   * @param {string} tableName - Table name.
   * @return {object} - Deletion status
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
   * Get an item from a DynamoDB table.
   *
   * @param {string} tableName - Table name.
   * @param {object} key - Item object (only the key is required).
   * @param {string} [attributes] - Comma-delimited list of attributes to retrieve.
   * @return {object} - {@link https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-dynamodb/interfaces/getitemcommandoutput.html GetItemCommandOutput}.
   */
  async getItem(tableName, key, attributes) {
    // Validate arguments.
    this.#validateTableName(tableName);
    this.#validateItem(key);
    this.#validateAttributeList(attributes);

    // Send command.
    this.#logger.debug(`Getting item from table ${tableName}...`, key);
    try {
      var response = await this.#doc.get({
        TableName: tableName,
        Key: key,
        ProjectionExpression: attributes,
      });
      this.#logger.debug(`Got item from table ${tableName}.`, response);
      return response;
    } catch (error) {
      this.#logger.error(
        `Failed to get item from table ${tableName}.`,
        response
      );
      throw new Error(error);
    }
  }

  /**
   * Put an item into a DynamoDB table.
   *
   * @param {string} tableName - Table name.
   * @param {object} item - Item object.
   * @return {object} - {@link https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-dynamodb/interfaces/putitemcommandoutput.html PutItemCommandOutput}.
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
}
