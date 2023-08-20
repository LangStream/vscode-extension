/* eslint @typescript-eslint/naming-convention: 0 */
import {AIActionAgent, AIActionType} from "../agents/aiAction";
import KafkaKubernetesInstance from "../instances/kafkaKubernetes";
import KafkaSecret from "../secrets/kafka";
import {IExampleApplication} from "../../interfaces/iExampleApplication";
import SimpleConsumeGateway from "../gateways/simpleConsume";
import SimpleProduceGateway from "../gateways/simpleProduce";

export default class ComputeOpenAIEmbeddingsExampleApplication implements IExampleApplication {
  constructor(private readonly snippetsDirPath: string) {}
  public get exampleApplicationName(){
    return "Compute OpenAI embeddings";
  }

  public get configuration() {
    return {
      resources: [
        {
          type: "open-ai-configuration",
          name: "OpenAI Azure configuration",
          configuration: {
            url: "{{{ secrets.open-ai.url }}}",
            "access-key": "{{{ secrets.open-ai.access-key }}}",
            provider: "azure"
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
    return new KafkaKubernetesInstance();
  }
  public get modules() {
    return [
      {
        name: "Compute embeddings example application using OpenAI",
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
          new AIActionAgent(AIActionType.computeAiEmbeddings, this.snippetsDirPath)
            .setInput("input-topic")
            .setOutput("output-topic")
            .setConfigurationValue("model", "text-embedding-ada-002")
            .asAgentConfiguration()
        ]
      }
      ];
  }
  public get secrets() {
    return [
      {
        name: "open-ai",
        id: "open-ai",
        data: {
          "access-key": "",
          "url": ""
        },
      },
      new KafkaSecret()
    ];
  }
}