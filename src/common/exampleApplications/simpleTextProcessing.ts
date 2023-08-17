/* eslint @typescript-eslint/naming-convention: 0 */
import StreamingApplication from "../streamingApplication";
import KafkaKubernetesInstance from "../instances/kafkaKubernetes";
import KafkaSecret from "../secrets/kafka";
import SimpleProduceGateway from "../gateways/simpleProduce";
import SimpleConsumeGateway from "../gateways/simpleConsume";
import {TextProcessorActionType, TextProcessorAgent} from "../agents/textProcessors";

export default class SimpleTextProcessingExampleApplication extends StreamingApplication {

  public constructor(snippetsDirPath: string) {
    const inputTopicName = "input-topic";
    const outputTopicName = "output-topic";

    const module = {
      name: "Text Processing",
      topics: [
        {
          "name": inputTopicName,
          "creation-mode": "create-if-not-exists"
        },
        {
          "name": outputTopicName,
          "creation-mode": "create-if-not-exists"
        }
      ],
      pipeline: [
        new TextProcessorAgent(TextProcessorActionType.documentToJson, snippetsDirPath)
          .setInput(inputTopicName)
          .setOutput(null)
          .asAgentConfiguration(),
        new TextProcessorAgent(TextProcessorActionType.textNormaliser, snippetsDirPath)
          .setInput(null)
          .setOutput(null)
          .asAgentConfiguration(),
        new TextProcessorAgent(TextProcessorActionType.textSplitter, snippetsDirPath)
          .setInput(null)
          .setOutput(outputTopicName)
          .asAgentConfiguration()
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
      new SimpleProduceGateway(inputTopicName),
      new SimpleConsumeGateway(outputTopicName)
    ];

    super("Simple text processing", module, instance, configuration, secrets, gateways);
  }
}