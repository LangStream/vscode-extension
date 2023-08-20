import KafkaKubernetesInstance from "../instances/kafkaKubernetes";
import KafkaSecret from "../secrets/kafka";
import CassandraSecret from "../secrets/cassandra";
import {TextProcessorActionType, TextProcessorAgent} from "../agents/textProcessors";
import {IExampleApplication} from "../../interfaces/iExampleApplication";

export default class QueryCassandraExampleApplication implements IExampleApplication {
  constructor(private readonly snippetsDirPath: string) {}
  public get exampleApplicationName(){
    return "Query Cassandra database";
  }
  public get configuration() {
    return {
      resources: [
        {
          name: "AstraDatasource",
          type: "datasource",
          configuration: {
            service: "astra",
            username: "{{{ secrets.cassandra.username }}}",
            password: "{{{ secrets.cassandra.password }}}",
            secureBundle: "{{{ secrets.cassandra.secureBundle }}}"
          }
        }
      ],
      dependencies: []
    };
  }
  public get gateways() {
    return [];
  }
  public get instance() {
    return new KafkaKubernetesInstance();
  }
  public get modules() {
    return [
      {
        name: "Query Cassandra",
        topics: [{
          name: "input-topic",
          "creation-mode": "create-if-not-exists"
        },{
          name: "output-topic",
          "creation-mode": "create-if-not-exists"
        }],
        pipelines: [
          new TextProcessorAgent(TextProcessorActionType.query, this.snippetsDirPath)
            .setInput("input-topic")
            .setOutput("output-topic")
            .setConfigurationValue("datasource", "AstraDatasource")
            .setConfigurationValue("query", "SELECT * FROM mykeyspace.products WHERE id = ?")
            .setConfigurationValue("fields", [ "value.id" ])
            .setConfigurationValue("output-field", "value.query-result")
            .asAgentConfiguration()
        ]
      }
    ];
  }
  public get secrets() {
    return [
      new KafkaSecret(),
      new CassandraSecret()
    ];
  }
}