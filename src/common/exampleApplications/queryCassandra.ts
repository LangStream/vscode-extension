import StreamingApplication from "../streamingApplication";
import KafkaKubernetesInstance from "../instances/kafkaKubernetes";
import KafkaSecret from "../secrets/kafka";
import CassandraSecret from "../secrets/cassandra";
import {TextProcessorActionType, TextProcessorAgent} from "../agents/textProcessors";
import {Pipeline} from "../../services/controlPlaneApi/gen";

export default class QueryCassandraExampleApplication extends StreamingApplication {
  constructor(snippetsDirPath: string) {
    const module = {
      name: "Query Cassandra",
      topics: [{
        name: "input-topic",
        "creation-mode": "create-if-not-exists"
      },{
        name: "output-topic",
        "creation-mode": "create-if-not-exists"
      }],
      pipeline: [
        new class implements Pipeline {
          name = "cassandra-sink";
          agents = [
        new TextProcessorAgent(TextProcessorActionType.query, snippetsDirPath)
          .setInput("input-topic")
          .setOutput("output-topic")
          .setConfigurationValue("datasource", "AstraDatasource")
          .setConfigurationValue("query", "SELECT * FROM mykeyspace.products WHERE id = ?")
          .setConfigurationValue("fields", [ "value.id" ])
          .setConfigurationValue("output-field", "value.query-result")
          .asAgentConfiguration()
          ];
        }
      ]
    };
    const instance = new KafkaKubernetesInstance();
    const configuration = {
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
    const secrets = [
      new KafkaSecret(),
      new CassandraSecret()
    ];

    super("Query Cassandra database", module, instance, configuration, secrets);
  }
}