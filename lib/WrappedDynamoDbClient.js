/**
 * @module WrappedDynamoDbClient
 */

// npm imports
import clientDynamoDb from '@aws-sdk/client-dynamodb';
const {
  DynamoDBClient,
  CreateTableCommand,
  DeleteItemCommand,
  DeleteTableCommand,
  DescribeTableCommand,
  GetItemCommand,
  PutItemCommand,
  waitUntilTableExists,
  waitUntilTableNotExists,
} = clientDynamoDb;

import _ from 'lodash';

/** @type {object} */
const defaultClientConfig = { region: 'us-east-1' };

/**
 * Wraps an AWS DynamoDB client to provide standard logging & services.
 */
export class WrappedDynamoDbClient {
  #client;
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
    config = defaultClientConfig,
    logger = console,
    logInternals = false,
  } = {}) {
    // Validate options.
    if (!logger.info || !logger.error || !logger.debug)
      throw new Error('logger must have info, error & debug methods');

    // Set state.
    this.#logger = logger;
    this.#client = new DynamoDBClient({
      ..._.omit(config, 'logger'),
      ...(logInternals ? { logger } : {}),
    });
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
    if (!_.isString(tableName) || !tableName.length)
      throw new Error('invalid tableName');
    if (!_.isPlainObject(options)) throw new Error('invalid options');

    // Compose command.
    this.#logger.debug(`Creating table ${tableName}...`, options);
    const command = new CreateTableCommand({
      TableName: tableName,
      ...options,
    });

    // Send command.
    try {
      var response = await this.#client.send(command);
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
   * @param {object} options - {@list https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-dynamodb/interfaces/deleteitemcommandinput.html DeleteItemCommandInput}.
   * @return {object} {@link https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-dynamodb/globals.html#waiterresult WaiterResult}
   */
  async deleteItem(options) {
    // Validate arguments.
    if (!_.isPlainObject(options)) throw new Error('invalid options');
    if (!_.isString(options.TableName) || !options.TableName.length)
      throw new Error('invalid options.TableName');
    if (!_.isPlainObject(options.Key)) throw new Error('invalid options.Key');

    // Compose command.
    this.#logger.debug(
      `Deleting item from table ${options.TableName}...`,
      options
    );
    const command = new DeleteItemCommand(options);

    // Send command.
    try {
      var response = await this.#client.send(command);
      this.#logger.debug(
        `Deleted item from table ${options.TableName}.`,
        response
      );
      return response;
    } catch (error) {
      this.#logger.error(
        `Failed to delete item from table ${options.TableName}.`,
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
    // Validate arguments.
    if (!_.isString(tableName) || !tableName.length)
      throw new Error('invalid tableName');

    // Compose command.
    this.#logger.info(`Deleting table ${tableName}...`);
    const command = new DeleteTableCommand({ TableName: tableName });

    // Send command.
    try {
      var response = await this.#client.send(command);
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
   * @param {object} options - {@list https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-dynamodb/interfaces/getitemcommandinput.html GetItemCommandInput}.
   * @return {object} - {@link https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-dynamodb/interfaces/getitemcommandoutput.html GetItemCommandOutput}.
   */
  async getItem(options) {
    // Validate arguments.
    if (!_.isPlainObject(options)) throw new Error('invalid options');
    if (!_.isString(options.TableName) || !options.TableName.length)
      throw new Error('invalid options.TableName');
    if (!_.isPlainObject(options.Key)) throw new Error('invalid options.Key');

    // Compose command.
    this.#logger.debug(
      `Getting item from table ${options.TableName}...`,
      options
    );
    const command = new GetItemCommand(options);

    // Send command.
    try {
      var response = await this.#client.send(command);
      this.#logger.debug(`Got item from table ${options.TableName}.`, response);
      return response;
    } catch (error) {
      this.#logger.error(
        `Failed to get item from table ${options.TableName}.`,
        response
      );
      throw new Error(error);
    }
  }

  /**
   * Get info about a DynamoDB table.
   *
   * @param {string} tableName - Table name.
   * @return {object} - {@link https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-dynamodb/interfaces/describetablecommandoutput.html DescribeTableCommandOutput}.
   */
  async getTableInfo(tableName) {
    // Compose command.
    this.#logger.debug(`Getting info about table ${tableName}...`);
    const command = new DescribeTableCommand({ TableName: tableName });

    // Send command.
    try {
      var response = await this.#client.send(command);
      this.#logger.debug(`Got info about table ${tableName}.`, response);
      return response;
    } catch (error) {
      this.#logger.error(
        `Failed to get info about table ${tableName}.`,
        response
      );
      throw new Error(error);
    }
  }

  /**
   * Put an item into a DynamoDB table.
   *
   * @param {object} options - {@list https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-dynamodb/interfaces/putitemcommandinput.html PutItemCommandInput}
   * @return {object} - {@link https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-dynamodb/interfaces/putitemcommandoutput.html PutItemCommandOutput}.
   */
  async putItem(options) {
    // Validate arguments.
    if (!_.isPlainObject(options)) throw new Error('invalid options');
    if (!_.isString(options.TableName) || !options.TableName.length)
      throw new Error('invalid options.TableName');
    if (!_.isPlainObject(options.Item)) throw new Error('invalid options.Item');

    // Compose command.
    this.#logger.debug(
      `Putting item to table ${options.TableName}...`,
      options
    );
    const command = new PutItemCommand(options);

    // Send command.
    const response = await this.#client.send(command);
    if (response.$metadata.httpStatusCode === 200)
      this.#logger.debug(`Put item to table ${options.TableName}.`, response);
    else
      this.#logger.error(
        `Failed to put item to table ${options.TableName}.`,
        response
      );

    return response;
  }
}
