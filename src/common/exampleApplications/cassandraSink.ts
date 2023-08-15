/* eslint @typescript-eslint/naming-convention: 0 */
import StreamingApplication from "../streamingApplication";
import {InputOutputActionType, InputOutputAgent} from "../agents/inputOutput";
import KafkaKubernetesInstance from "../instances/kafkaKubernetes";
import KafkaSecret from "../secrets/kafka";
import CassandraSecret from "../secrets/cassandra";

export default class CassandraSinkExampleApplication extends StreamingApplication {
  constructor(snippetsDirPath: string, kafkaSecret: KafkaSecret = new KafkaSecret(), cassandraSecret: CassandraSecret = new CassandraSecret()) {
    const module = {
      name: "Write to Cassandra",
      topics: [{
        name: "input-topic",
        "creation-mode": "create-if-not-exists"
      }],
      pipeline: [
        new InputOutputAgent(InputOutputActionType.cassandraSink, snippetsDirPath)
          .setInput("input-topic")
          .setOutput(null)
          .setConfigurationValue("name", "cassandra-sink")
          .setConfigurationValue("connector.class", "com.datastax.oss.kafka.sink.CassandraSinkConnector")
          .setConfigurationValue("connector.class", "com.datastax.oss.kafka.sink.CassandraSinkConnector")
          .setConfigurationValue("key.converter", "org.apache.kafka.connect.storage.StringConverter")
          .setConfigurationValue("value.converter", "org.apache.kafka.connect.storage.StringConverter")
          .setConfigurationValue("cloud.secureConnectBundle", "{{{ secrets.cassandra.secure-connect-bundle }}}")
          .setConfigurationValue("auth.username", "{{{ secrets.cassandra.username }}}")
          .setConfigurationValue("auth.password", "{{{ secrets.cassandra.password }}}")
          .setConfigurationValue("topic.input-topic.vsearch.products.mapping", "id=value.id,description=value.description,name=value.name")
          .asAgentConfiguration()
      ]
    };
    const instance = new KafkaKubernetesInstance();
    const configuration = {
      resources: [],
      dependencies: [
        {
          name: "Kafka Connect Sink for Apache Cassandra from DataStax",
          url: "https://github.com/datastax/kafka-sink/releases/download/1.5.0/kafka-connect-cassandra-sink-1.5.0.jar",
          sha512sum: "242bf60363d36bd426232451cac836a24ae8d510857372a128f601503ad77aa9eabf14c4f484ca0830b6a68d9e8664e3820739ad8dd3deee2c58e49a94a20a3c",
          type: "java-library"
        }
      ]
    };
    const secrets = [
      kafkaSecret,
      cassandraSecret
    ];
    const gateways = [
      {
        id: "produce-input",
        type: "produce",
        topic: "input-topic"
      }
    ];

    super(module, instance, configuration, secrets, gateways);
  }
}