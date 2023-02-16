/**
 * @module WrappedDynamoDbClient
 */

// npm imports
import clientDynamoDb from '@aws-sdk/client-dynamodb';
const { DynamoDBClient } = clientDynamoDb;

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
}
