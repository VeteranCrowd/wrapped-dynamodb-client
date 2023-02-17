/**
 * @module WrappedDynamoDbClient
 */

// npm imports
import clientDynamoDb from '@aws-sdk/client-dynamodb';
const {
  DynamoDBClient,
  CreateTableCommand,
  DeleteTableCommand,
  DescribeTableCommand,
  PutItemCommand,
} = clientDynamoDb;

import retry from 'async-retry';
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
   * @param {object} [options] - {@link https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-dynamodb/interfaces/createtablecommandinput.html CreateTableCommandInput}
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
      var response = (({ TableDescription: Table, ...rest }) => ({
        Table,
        ...rest,
      }))(await this.#client.send(command));
      if (!response.Table?.TableStatus) throw new Error(response);
    } catch (error) {
      this.#logger.error(`Failed to create table ${tableName}.`, error);
      throw new Error(error);
    }
    this.#logger.info(`Table ${tableName} created.`);

    // Await table activation.
    if (response.Table.TableStatus === 'CREATING') {
      this.#logger.info(`Awaiting activation of table ${tableName}...`);
      response = await retry(async () => {
        const response = await this.getTableInfo(tableName);

        if (response.Table.TableStatus === 'CREATING')
          throw new Error(response);

        return response;
      });
    }
    this.#logger.info(`Table ${tableName} activated.`);

    return response;
  }

  /**
   * Delete a DynamoDB table.
   *
   * @param {string} tableName - Table name.
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
      var response = (({ TableDescription: Table, ...rest }) => ({
        Table,
        ...rest,
      }))(await this.#client.send(command));
    } catch (error) {
      this.#logger.error(`Failed to delete table ${tableName}.`, error);
      throw new Error(error);
    }

    // Await table deletion.
    if (response.Table.TableStatus === 'DELETING') {
      this.#logger.info(`Awaiting deletion of table ${tableName}...`);
      response = await retry(async () => {
        try {
          const response = await this.getTableInfo(tableName);

          if (response.Table.TableStatus === 'DELETING')
            throw new Error(response);

          return response;
        } catch {
          return { Table: { TableStatus: 'DELETED' } };
        }
      });
    }
    this.#logger.info(`Table ${tableName} deleted.`);
    this.#logger.debug(response);

    return response;
  }

  /**
   * Get info about a DynamoDB table.
   *
   * @param {string} tableName - Table name.
   */
  async getTableInfo(tableName) {
    // Compose command.
    this.#logger.debug(`Getting info about table ${tableName}...`);
    const command = new DescribeTableCommand({ TableName: tableName });

    // Send command.
    const response = await this.#client.send(command);
    if (response.$metadata.httpStatusCode === 200)
      this.#logger.debug(`Got info about table ${tableName}.`, response);
    else
      this.#logger.error(
        `Failed to get info about table ${tableName}.`,
        response
      );

    return response;
  }
}
