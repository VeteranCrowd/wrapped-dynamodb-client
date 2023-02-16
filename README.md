# WrappedDynamoDbClient

This package wraps the [DynamoDB Client - AWS SDK for JavaScript v3](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-dynamodb/index.html) to provide consistent logging and other services.

# API Documentation

<a name="module_WrappedDynamoDbClient"></a>

## WrappedDynamoDbClient

* [WrappedDynamoDbClient](#module_WrappedDynamoDbClient)
    * _static_
        * [.WrappedDynamoDbClient](#module_WrappedDynamoDbClient.WrappedDynamoDbClient)
            * [new exports.WrappedDynamoDbClient([options])](#new_module_WrappedDynamoDbClient.WrappedDynamoDbClient_new)
    * _inner_
        * [~defaultClientConfig](#module_WrappedDynamoDbClient..defaultClientConfig) : <code>object</code>

<a name="module_WrappedDynamoDbClient.WrappedDynamoDbClient"></a>

### WrappedDynamoDbClient.WrappedDynamoDbClient
Wraps an AWS DynamoDB client to provide standard logging & services.

**Kind**: static class of [<code>WrappedDynamoDbClient</code>](#module_WrappedDynamoDbClient)  
<a name="new_module_WrappedDynamoDbClient.WrappedDynamoDbClient_new"></a>

#### new exports.WrappedDynamoDbClient([options])
WrappedDynamoDbClient constructor.


| Param | Type | Description |
| --- | --- | --- |
| [options] | <code>object</code> | Options. |
| [options.logger] | <code>object</code> | Logger instance (default is [global console object](https://nodejs.org/api/console.html#class-console)). Must have info, error & debug methods |
| [options.logInternals] | <code>boolean</code> | Log AWS client internals (default is false). |
| [options.config] | <code>object</code> | [DynamoDBClientConfig](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-dynamodb/interfaces/dynamodbclientconfig.html). |

<a name="module_WrappedDynamoDbClient..defaultClientConfig"></a>

### WrappedDynamoDbClient~defaultClientConfig : <code>object</code>
**Kind**: inner constant of [<code>WrappedDynamoDbClient</code>](#module_WrappedDynamoDbClient)  

---

See more great templates and other tools on
[my GitHub Profile](https://github.com/karmaniverous)!
