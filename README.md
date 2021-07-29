# AWS IoT fake mqtt retain

> The MQTT specification provides a provision for the publisher to request that the broker retain the last message sent to a topic and send it to all future topic subscribers. AWS IoT doesn't support retained messages. If a request is made to retain messages, the connection is disconnected.

[AWS IoT differences from MQTT version 3.1.1 specification](https://docs.aws.amazon.com/iot/latest/developerguide/mqtt.html#mqtt-differences)

That can be pretty annoying, sometimes you want to retain and recall topic messages without bending to using [IoT Shadows](https://docs.aws.amazon.com/iot/latest/developerguide/iot-device-shadows.html).

This workaround requires you to specify a list of topics (or wildcards) that will be stored in a dynamodb table and then when a client subscribes to that topic, it will receive the previous message.

Downsides/caveats:

- All topic subscribers will receive the rebroadcast message, there isn't a way to direct to individual subscribers
- Use it sparingly, actions, lambda and dynamo puts can add up and be expensive

**NOTE: Currently doesn't rebroadcasting to wildcard subscriptions**
