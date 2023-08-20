/* eslint @typescript-eslint/naming-convention: 0 */
import KafkaKubernetesInstance from "../instances/kafkaKubernetes";
import KafkaSecret from "../secrets/kafka";
import {AIActionAgent, AIActionType} from "../agents/aiAction";
import {IExampleApplication} from "../../interfaces/iExampleApplication";

export default class OpenAICompletionExampleApplication implements IExampleApplication {
  constructor(private readonly snippetsDirPath: string) {}
  public get exampleApplicationName(){
    return "OpenAI completions";
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
    return [];
  }
  public get instance() {
    return new KafkaKubernetesInstance();
  }
  public get modules() {
    return [
      {
        name: "OpenAI completion example application",
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
            .setConfigurationValue("model", "gpt-35-turbo")
            .setConfigurationValue("completion-field", "value.completion")
            .setConfigurationValue("log-field", "value.fullPrompt")
            .setConfigurationValue("messages", [
              {
                "role": "user",
                "content": "{What can you tell me about {{{% value}}} ?"
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
        name: "open-ai",
        id: "open-ai",
        data: {
          "access-key": "",
          url: "",
        },
      },
      new KafkaSecret()
    ];
  }
}