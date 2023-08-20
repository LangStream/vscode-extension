/* eslint @typescript-eslint/naming-convention: 0 */
import KafkaKubernetesInstance from "../instances/kafkaKubernetes";
import KafkaSecret from "../secrets/kafka";
import SimpleProduceGateway from "../gateways/simpleProduce";
import SimpleConsumeGateway from "../gateways/simpleConsume";
import {TextProcessorActionType, TextProcessorAgent} from "../agents/textProcessors";
import {IExampleApplication} from "../../interfaces/iExampleApplication";
import {ISecret} from "../../interfaces/iSecret";
import CassandraSecret from "../secrets/cassandra";

export default class SimpleTextProcessingExampleApplication implements IExampleApplication {
  private readonly inputTopicName = "input-topic";
  private readonly outputTopicName = "output-topic";

  constructor(private readonly snippetsDirPath: string, private readonly kafkaSecret: ISecret = new KafkaSecret()) {}
  public get exampleApplicationName(){
    return "Simple text processing";
  }
  public get configuration() {
    return {
      resources: [],
      dependencies: []
    };
  }
  public get gateways() {
    return [
      new SimpleProduceGateway(),
      new SimpleConsumeGateway()
    ];
  }
  public get instance() {
    return new KafkaKubernetesInstance();
  }
  public get modules() {
    return [
      {
        name: "Text Processing",
        topics: [
          {
            "name": this.inputTopicName,
            "creation-mode": "create-if-not-exists"
          },
          {
            "name": this.outputTopicName,
            "creation-mode": "create-if-not-exists"
          }
        ],
        pipelines: [
          new TextProcessorAgent(TextProcessorActionType.documentToJson, this.snippetsDirPath)
            .setInput(this.inputTopicName)
            .setOutput(null)
            .asAgentConfiguration(),
          new TextProcessorAgent(TextProcessorActionType.textNormaliser, this.snippetsDirPath)
            .setInput(null)
            .setOutput(null)
            .asAgentConfiguration(),
          new TextProcessorAgent(TextProcessorActionType.textSplitter, this.snippetsDirPath)
            .setInput(null)
            .setOutput(this.outputTopicName)
            .asAgentConfiguration()
        ]
      }
    ];
  }
  public get secrets() {
    return [
      this.kafkaSecret
    ];
  }
}