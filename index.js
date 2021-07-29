const AWS = require('aws-sdk')
const dynamoDb = new AWS.DynamoDB.DocumentClient()

const TableName = "iotRetain"

module.exports.mqttMatch = function (filter, topic) {
  const filterArray = filter.split('/')
  const length = filterArray.length
  const topicArray = topic.split('/')

  for (var i = 0; i < length; ++i) {
    var left = filterArray[i]
    var right = topicArray[i]
    if (left === '#') return topicArray.length >= length - 1
    if (left !== '+' && left !== right) return false
  }

  return length === topicArray.length
}

module.exports.getTopicsFromSubscriptions = async (subscriptions) => {
  const params = {
    TableName,
    ProjectionExpression: "topic"
  }
  let scanResults = []
  let items
  do {
    items = await dynamoDb.scan(params).promise()
    items.Items.forEach((item) =>
      scanResults.push(item.topic)
    )
    params.ExclusiveStartKey = items.LastEvaluatedKey
  } while (typeof items.LastEvaluatedKey !== "undefined")

  return scanResults.filter(topic => {
    return subscriptions.map(filter => module.exports.mqttMatch(filter, topic)).includes(true)
  })
}

module.exports.getPayloadsFromTopics = async (topics) =>
  (await dynamoDb.batchGet({
    RequestItems: {
      [TableName]: {
        Keys: topics.map(topic => {
          return {
            topic
          }
        })
      },
    }
  }).promise()).Responses[TableName]


module.exports.retainer = event =>
  dynamoDb.put({
    TableName,
    Item: {
      topic: event.topic,
      payload: event.payload
    },
  }).promise()

module.exports.recaller = async event => {
  const iotdata = new AWS.IotData({ endpoint: process.env.IOT_ENDPOINT })

  const topics = await module.exports.getTopicsFromSubscriptions(event.topics)
  if (topics.length === 0) return
  const messages = await module.exports.getPayloadsFromTopics(topics)
  if (messages.length === 0) return
  return Promise.all(
    messages.map(message =>
      iotdata.publish({
        topic: message.topic,
        payload: JSON.stringify(message.payload),
      }).promise()
    )
  )
}
