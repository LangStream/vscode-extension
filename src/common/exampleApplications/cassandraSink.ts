/* eslint @typescript-eslint/naming-convention: 0 */
import {InputOutputActionType, InputOutputAgent} from "../agents/inputOutput";
import KafkaKubernetesInstance from "../instances/kafkaKubernetes";
import KafkaSecret from "../secrets/kafka";
import CassandraSecret from "../secrets/cassandra";
import {IExampleApplication} from "../../interfaces/iExampleApplication";
import SimpleProduceGateway from "../gateways/simpleProduce";
import {ISecret} from "../../interfaces/iSecret";

export default class CassandraSinkExampleApplication implements IExampleApplication {
  constructor(private readonly snippetsDirPath: string, private readonly kafkaSecret: ISecret = new KafkaSecret(), private readonly cassandraSecret: ISecret = new CassandraSecret()) {}
  public get exampleApplicationName(){
    return "Sink to Cassandra database";
  }
  public get gateways(){
    return [
      new SimpleProduceGateway()
    ];
  }
  public get instance() {
    return new KafkaKubernetesInstance();
  }
  public get modules() {
    return [
      {
        name: "Write to Cassandra",
        topics: [{
          name: "input-topic",
          "creation-mode": "create-if-not-exists"
        }],
        pipelines: [
          new InputOutputAgent(InputOutputActionType.cassandraSink, this.snippetsDirPath)
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
      }
    ];
  }
  public get secrets() {
    return [
        this.kafkaSecret,
        this.cassandraSecret
      ];
  }

  public get configuration() {
    return {
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
  }
}