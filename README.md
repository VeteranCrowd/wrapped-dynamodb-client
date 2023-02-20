# WrappedDynamoDbClient

This package wraps the [DynamoDB Client - AWS SDK for JavaScript v3](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-dynamodb/index.html) to provide a streamlined developer experience and consistent logging.

# API Documentation

  <a name="module_wrapped-dynamodb-client.WrappedDynamoDbClient"></a>

## wrapped-dynamodb-client.WrappedDynamoDbClient
Wraps an AWS DynamoDB client to provide standard logging & services.

**Kind**: static class of [<code>wrapped-dynamodb-client</code>](#module_wrapped-dynamodb-client)  

* [.WrappedDynamoDbClient](#module_wrapped-dynamodb-client.WrappedDynamoDbClient)
    * [new exports.WrappedDynamoDbClient([options])](#new_module_wrapped-dynamodb-client.WrappedDynamoDbClient_new)
    * _item_
        * [.deleteItem(tableName, key)](#module_wrapped-dynamodb-client.WrappedDynamoDbClient+deleteItem) ⇒ <code>object</code>
        * [.getItem(tableName, key, [attributes])](#module_wrapped-dynamodb-client.WrappedDynamoDbClient+getItem) ⇒ <code>object</code>
        * [.putItem(tableName, item)](#module_wrapped-dynamodb-client.WrappedDynamoDbClient+putItem) ⇒ <code>object</code>
    * _table_
        * [.createTable(tableName, [options])](#module_wrapped-dynamodb-client.WrappedDynamoDbClient+createTable) ⇒ <code>object</code>
        * [.deleteTable(tableName)](#module_wrapped-dynamodb-client.WrappedDynamoDbClient+deleteTable) ⇒ <code>object</code>

<a name="new_module_wrapped-dynamodb-client.WrappedDynamoDbClient_new"></a>

### new exports.WrappedDynamoDbClient([options])
WrappedDynamoDbClient constructor.


| Param | Type | Description |
| --- | --- | --- |
| [options] | <code>object</code> | Options. |
| [options.logger] | <code>object</code> | Logger instance (default is [global console object](https://nodejs.org/api/console.html#class-console)). Must have info, error & debug methods |
| [options.logInternals] | <code>boolean</code> | Log AWS client internals (default is false). |
| [options.config] | <code>object</code> | [DynamoDBClientConfig](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-dynamodb/interfaces/dynamodbclientconfig.html). |

<a name="module_wrapped-dynamodb-client.WrappedDynamoDbClient+deleteItem"></a>

### wrappedDynamoDbClient.deleteItem(tableName, key) ⇒ <code>object</code>
Delete an item from a DynamoDB table.

**Kind**: instance method of [<code>WrappedDynamoDbClient</code>](#module_wrapped-dynamodb-client.WrappedDynamoDbClient)  
**Returns**: <code>object</code> - [WaiterResult](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-dynamodb/globals.html#waiterresult)  
**Category**: item  

| Param | Type | Description |
| --- | --- | --- |
| tableName | <code>string</code> | Table name. |
| key | <code>object</code> | Item object (only the key is required). |

<a name="module_wrapped-dynamodb-client.WrappedDynamoDbClient+getItem"></a>

### wrappedDynamoDbClient.getItem(tableName, key, [attributes]) ⇒ <code>object</code>
Get an item from a DynamoDB table.

**Kind**: instance method of [<code>WrappedDynamoDbClient</code>](#module_wrapped-dynamodb-client.WrappedDynamoDbClient)  
**Returns**: <code>object</code> - - [GetItemCommandOutput](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-dynamodb/interfaces/getitemcommandoutput.html).  
**Category**: item  

| Param | Type | Description |
| --- | --- | --- |
| tableName | <code>string</code> | Table name. |
| key | <code>object</code> | Item object (only the key is required). |
| [attributes] | <code>string</code> | Comma-delimited list of attributes to retrieve. |

<a name="module_wrapped-dynamodb-client.WrappedDynamoDbClient+putItem"></a>

### wrappedDynamoDbClient.putItem(tableName, item) ⇒ <code>object</code>
Put an item into a DynamoDB table.

**Kind**: instance method of [<code>WrappedDynamoDbClient</code>](#module_wrapped-dynamodb-client.WrappedDynamoDbClient)  
**Returns**: <code>object</code> - - [PutItemCommandOutput](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-dynamodb/interfaces/putitemcommandoutput.html).  
**Category**: item  

| Param | Type | Description |
| --- | --- | --- |
| tableName | <code>string</code> | Table name. |
| item | <code>object</code> | Item object. |

<a name="module_wrapped-dynamodb-client.WrappedDynamoDbClient+createTable"></a>

### wrappedDynamoDbClient.createTable(tableName, [options]) ⇒ <code>object</code>
Create a DynamoDB table.

**Kind**: instance method of [<code>WrappedDynamoDbClient</code>](#module_wrapped-dynamodb-client.WrappedDynamoDbClient)  
**Returns**: <code>object</code> - [WaiterResult](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-dynamodb/globals.html#waiterresult)  
**Category**: table  

| Param | Type | Description |
| --- | --- | --- |
| tableName | <code>string</code> | Table name. |
| [options] | <code>object</code> | [CreateTableCommandInput](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-dynamodb/interfaces/createtablecommandinput.html). |

<a name="module_wrapped-dynamodb-client.WrappedDynamoDbClient+deleteTable"></a>

### wrappedDynamoDbClient.deleteTable(tableName) ⇒ <code>object</code>
Delete a DynamoDB table.

**Kind**: instance method of [<code>WrappedDynamoDbClient</code>](#module_wrapped-dynamodb-client.WrappedDynamoDbClient)  
**Returns**: <code>object</code> - - Deletion status  
**Category**: table  

| Param | Type | Description |
| --- | --- | --- |
| tableName | <code>string</code> | Table name. |


---

See more great templates and other tools on
[my GitHub Profile](https://github.com/karmaniverous)!
