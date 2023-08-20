/* eslint @typescript-eslint/naming-convention: 0 */
import KafkaKubernetesInstance from "../instances/kafkaKubernetes";
import KafkaSecret from "../secrets/kafka";
import {AIActionAgent, AIActionType} from "../agents/aiAction";
import {IExampleApplication} from "../../interfaces/iExampleApplication";
import SimpleProduceGateway from "../gateways/simpleProduce";
import SimpleConsumeGateway from "../gateways/simpleConsume";

export default class HuggingfaceCompletionExampleApplication implements IExampleApplication {
  constructor(private readonly snippetsDirPath: string) {}
  public get exampleApplicationName(){
    return "Huggingface completions";
  }
  public get configuration() {
    return {
      resources: [
        {
          type: "hugging-face-configuration",
          name: "Hugging Face AI configuration",
          configuration: {
            "access-key": "{{{ secrets.hugging-face.access-key }}}"
          }
        }
      ],
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
    return  new KafkaKubernetesInstance();
  }
  public get modules() {
    return [
      {
        name: "Hugging-face completion example application",
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
        pipelines: [
          new AIActionAgent(AIActionType.aiChatCompletions, this.snippetsDirPath)
            .setInput("input-topic")
            .setOutput("output-topic")
            .setConfigurationValue("model", "bert-base-uncased")
            .setConfigurationValue("completion-field", "value.completion")
            .setConfigurationValue("log-field", "value.fullPrompt")
            .setConfigurationValue("messages", [
              {
                "role": "user",
                "content": "{{% value }} [MASK]"
              }
            ])
            .asAgentConfiguration()
        ]
      }
    ];
  }
  public get secrets() {
    return [
      {
        name: "hugging-face",
        id: "hugging-face",
        data: {
          "access-key": ""
        },
      },
      new KafkaSecret()
    ];
  }
}