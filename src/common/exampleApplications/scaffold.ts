import KafkaKubernetesInstance from "../instances/kafkaKubernetes";
import KafkaSecret from "../secrets/kafka";
import StreamingApplication from "../streamingApplication";
import SimpleProduceGateway from "../gateways/simpleProduce";
import SimpleConsumeGateway from "../gateways/simpleConsume";

export default class ScaffoldExampleApplication extends StreamingApplication {
  public constructor() {
    const module = {
      name: "LangStream Application Scaffolding",
      topics: [
        {
          "name": "input-topic",
          "creation-mode": "create-if-not-exists"
        },
        {
          "name": "output-topic",
          "creation-mode": "create-if-not-exists"
        }
      ],
      pipeline: [
      ]
    };
    const instance = new KafkaKubernetesInstance();
    const configuration = {
      resources: [],
      dependencies: []
    };
    const secrets = [
      new KafkaSecret()
    ];
    const gateways = [
      new SimpleProduceGateway(),
      new SimpleConsumeGateway()
    ];

    super("Application scaffolding", module, instance, configuration, secrets, gateways);
  }
}