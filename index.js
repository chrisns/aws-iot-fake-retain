const AWS = require('aws-sdk');
const dynamoDb = new AWS.DynamoDB.DocumentClient()
const iotdata = new AWS.IotData({ endpoint: process.env.IOT_ENDPOINT })

const TableName = "iotRetain"

module.exports.retainer = event =>
  dynamoDb.put({
    TableName,
    Item: {
      topic: event.topic,
      payload: event.payload
    },
  }).promise()


module.exports.recaller = event =>
  Promise.all(
    event.topics.map(topic =>
      dynamoDb.get({
        TableName,
        Key: {
          topic,
        },
      }).promise().then(result =>
        iotdata.publish({
          topic: result.Item.topic,
          payload: JSON.stringify(result.Item.payload),
        }).promise()
      )
    )
  )
