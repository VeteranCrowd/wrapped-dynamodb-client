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
        * [.deleteItem(tableName, key)](#module_wrapped-dynamodb-client.WrappedDynamoDbClient+deleteItem) ⇒ <code>Promise.&lt;object&gt;</code>
        * [.deleteItems(tableName, keys)](#module_wrapped-dynamodb-client.WrappedDynamoDbClient+deleteItems) ⇒ <code>Promise.&lt;number&gt;</code>
        * [.getItem(tableName, key, [attributes])](#module_wrapped-dynamodb-client.WrappedDynamoDbClient+getItem) ⇒ <code>Promise.&lt;object&gt;</code>
        * [.purgeItems(tableName, keys)](#module_wrapped-dynamodb-client.WrappedDynamoDbClient+purgeItems) ⇒ <code>Promise.&lt;number&gt;</code>
        * [.putItem(tableName, item)](#module_wrapped-dynamodb-client.WrappedDynamoDbClient+putItem) ⇒ <code>Promise.&lt;object&gt;</code>
        * [.putItems(tableName, items)](#module_wrapped-dynamodb-client.WrappedDynamoDbClient+putItems) ⇒ <code>Promise.&lt;Array&gt;</code>
        * [.query(tableName, options)](#module_wrapped-dynamodb-client.WrappedDynamoDbClient+query) ⇒ <code>Promise.&lt;object&gt;</code>
        * [.scan(tableName, options)](#module_wrapped-dynamodb-client.WrappedDynamoDbClient+scan) ⇒ <code>Promise.&lt;object&gt;</code>
    * _table_
        * [.createTable(tableName, [options])](#module_wrapped-dynamodb-client.WrappedDynamoDbClient+createTable) ⇒ <code>Promise.&lt;object&gt;</code>
        * [.deleteTable(tableName)](#module_wrapped-dynamodb-client.WrappedDynamoDbClient+deleteTable) ⇒ <code>Promise.&lt;object&gt;</code>
        * [.describeTable(tableName)](#module_wrapped-dynamodb-client.WrappedDynamoDbClient+describeTable) ⇒ <code>Promise.&lt;object&gt;</code>

<a name="new_module_wrapped-dynamodb-client.WrappedDynamoDbClient_new"></a>

### new exports.WrappedDynamoDbClient([options])
WrappedDynamoDbClient constructor.


| Param | Type | Description |
| --- | --- | --- |
| [options] | <code>object</code> | Options. |
| [options.logger] | <code>object</code> | Logger instance (default is [global console object](https://nodejs.org/api/console.html#class-console)). Must have info, error & debug methods |
| [options.logInternals] | <code>boolean</code> | Log AWS client internals (default is false). |
| [options.config] | <code>object</code> | [DynamoDBClientConfig](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-dynamodb/interfaces/dynamodbclientconfig.html) object. |

<a name="module_wrapped-dynamodb-client.WrappedDynamoDbClient+deleteItem"></a>

### wrappedDynamoDbClient.deleteItem(tableName, key) ⇒ <code>Promise.&lt;object&gt;</code>
Delete an item from a DynamoDB table.

**Kind**: instance method of [<code>WrappedDynamoDbClient</code>](#module_wrapped-dynamodb-client.WrappedDynamoDbClient)  
**Returns**: <code>Promise.&lt;object&gt;</code> - [WaiterResult](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-dynamodb/globals.html#waiterresult) object.  
**Category**: item  

| Param | Type | Description |
| --- | --- | --- |
| tableName | <code>string</code> | Table name. |
| key | <code>object</code> | Item object (only the key is required). |

<a name="module_wrapped-dynamodb-client.WrappedDynamoDbClient+deleteItems"></a>

### wrappedDynamoDbClient.deleteItems(tableName, keys) ⇒ <code>Promise.&lt;number&gt;</code>
Delete multiple items from a DynamoDB table.

**Kind**: instance method of [<code>WrappedDynamoDbClient</code>](#module_wrapped-dynamodb-client.WrappedDynamoDbClient)  
**Returns**: <code>Promise.&lt;number&gt;</code> - Array of responses from chunked batchWrite operations.  
**Category**: item  

| Param | Type | Description |
| --- | --- | --- |
| tableName | <code>string</code> | Table name. |
| keys | <code>Array.&lt;object&gt;</code> | Array of item objects (only the key is required). |

<a name="module_wrapped-dynamodb-client.WrappedDynamoDbClient+getItem"></a>

### wrappedDynamoDbClient.getItem(tableName, key, [attributes]) ⇒ <code>Promise.&lt;object&gt;</code>
Get an item from a DynamoDB table.

**Kind**: instance method of [<code>WrappedDynamoDbClient</code>](#module_wrapped-dynamodb-client.WrappedDynamoDbClient)  
**Returns**: <code>Promise.&lt;object&gt;</code> - - [GetItemCommandOutput](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-dynamodb/interfaces/getitemcommandoutput.html) object.  
**Category**: item  

| Param | Type | Description |
| --- | --- | --- |
| tableName | <code>string</code> | Table name. |
| key | <code>object</code> | Item object (only the key is required). |
| [attributes] | <code>string</code> \| <code>Array.&lt;string&gt;</code> | Comma-delimited list or string array of attributes to retrieve. |

<a name="module_wrapped-dynamodb-client.WrappedDynamoDbClient+purgeItems"></a>

### wrappedDynamoDbClient.purgeItems(tableName, keys) ⇒ <code>Promise.&lt;number&gt;</code>
Purge all items from a DynamoDB table.

**Kind**: instance method of [<code>WrappedDynamoDbClient</code>](#module_wrapped-dynamodb-client.WrappedDynamoDbClient)  
**Returns**: <code>Promise.&lt;number&gt;</code> - Total items purged from table.  
**Category**: item  

| Param | Type | Description |
| --- | --- | --- |
| tableName | <code>string</code> | Table name. |
| keys | <code>Array.&lt;string&gt;</code> | Item keys. |

<a name="module_wrapped-dynamodb-client.WrappedDynamoDbClient+putItem"></a>

### wrappedDynamoDbClient.putItem(tableName, item) ⇒ <code>Promise.&lt;object&gt;</code>
Put an item into a DynamoDB table.

**Kind**: instance method of [<code>WrappedDynamoDbClient</code>](#module_wrapped-dynamodb-client.WrappedDynamoDbClient)  
**Returns**: <code>Promise.&lt;object&gt;</code> - - [PutItemCommandOutput](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-dynamodb/interfaces/putitemcommandoutput.html) object.  
**Category**: item  

| Param | Type | Description |
| --- | --- | --- |
| tableName | <code>string</code> | Table name. |
| item | <code>object</code> | Item object. |

<a name="module_wrapped-dynamodb-client.WrappedDynamoDbClient+putItems"></a>

### wrappedDynamoDbClient.putItems(tableName, items) ⇒ <code>Promise.&lt;Array&gt;</code>
Put multiple items into a DynamoDB table.

**Kind**: instance method of [<code>WrappedDynamoDbClient</code>](#module_wrapped-dynamodb-client.WrappedDynamoDbClient)  
**Returns**: <code>Promise.&lt;Array&gt;</code> - Array of responses from chunked batchWrite operations.  
**Category**: item  

| Param | Type | Description |
| --- | --- | --- |
| tableName | <code>string</code> | Table name. |
| items | <code>Array.&lt;object&gt;</code> | Array of item objects. |

<a name="module_wrapped-dynamodb-client.WrappedDynamoDbClient+query"></a>

### wrappedDynamoDbClient.query(tableName, options) ⇒ <code>Promise.&lt;object&gt;</code>
Query items from a DynamoDB table.

**Kind**: instance method of [<code>WrappedDynamoDbClient</code>](#module_wrapped-dynamodb-client.WrappedDynamoDbClient)  
**Returns**: <code>Promise.&lt;object&gt;</code> - [QueryCommandOutput](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-dynamodb/interfaces/querycommandoutput.html) object.  
**Category**: item  

| Param | Type | Description |
| --- | --- | --- |
| tableName | <code>string</code> | Table name. |
| options | <code>object</code> | [QueryCommandInput](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-dynamodb/interfaces/querycommandinput.html) object. |

<a name="module_wrapped-dynamodb-client.WrappedDynamoDbClient+scan"></a>

### wrappedDynamoDbClient.scan(tableName, options) ⇒ <code>Promise.&lt;object&gt;</code>
Scan items from a DynamoDB table.

**Kind**: instance method of [<code>WrappedDynamoDbClient</code>](#module_wrapped-dynamodb-client.WrappedDynamoDbClient)  
**Returns**: <code>Promise.&lt;object&gt;</code> - [ScanCommandOutput](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-dynamodb/interfaces/scancommandoutput.html) object.  
**Category**: item  

| Param | Type | Description |
| --- | --- | --- |
| tableName | <code>string</code> | Table name. |
| options | <code>object</code> | [ScanCommandInput](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-dynamodb/interfaces/scancommandinput.html) object. |

<a name="module_wrapped-dynamodb-client.WrappedDynamoDbClient+createTable"></a>

### wrappedDynamoDbClient.createTable(tableName, [options]) ⇒ <code>Promise.&lt;object&gt;</code>
Create a DynamoDB table.

**Kind**: instance method of [<code>WrappedDynamoDbClient</code>](#module_wrapped-dynamodb-client.WrappedDynamoDbClient)  
**Returns**: <code>Promise.&lt;object&gt;</code> - [WaiterResult](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-dynamodb/globals.html#waiterresult) object.  
**Category**: table  

| Param | Type | Description |
| --- | --- | --- |
| tableName | <code>string</code> | Table name. |
| [options] | <code>object</code> | [CreateTableCommandInput](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-dynamodb/interfaces/createtablecommandinput.html) object. |

<a name="module_wrapped-dynamodb-client.WrappedDynamoDbClient+deleteTable"></a>

### wrappedDynamoDbClient.deleteTable(tableName) ⇒ <code>Promise.&lt;object&gt;</code>
Delete a DynamoDB table.

**Kind**: instance method of [<code>WrappedDynamoDbClient</code>](#module_wrapped-dynamodb-client.WrappedDynamoDbClient)  
**Returns**: <code>Promise.&lt;object&gt;</code> - - Deletion status  
**Category**: table  

| Param | Type | Description |
| --- | --- | --- |
| tableName | <code>string</code> | Table name. |

<a name="module_wrapped-dynamodb-client.WrappedDynamoDbClient+describeTable"></a>

### wrappedDynamoDbClient.describeTable(tableName) ⇒ <code>Promise.&lt;object&gt;</code>
Describe a DynamoDB table.

**Kind**: instance method of [<code>WrappedDynamoDbClient</code>](#module_wrapped-dynamodb-client.WrappedDynamoDbClient)  
**Returns**: <code>Promise.&lt;object&gt;</code> - - [TableDescription](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-dynamodb/interfaces/tabledescription-5.html)}  
**Category**: table  

| Param | Type | Description |
| --- | --- | --- |
| tableName | <code>string</code> | Table name. |


---

See more great templates and other tools on
[my GitHub Profile](https://github.com/karmaniverous)!
