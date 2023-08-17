/* eslint @typescript-eslint/naming-convention: 0 */
import StreamingApplication from "../streamingApplication";
import KafkaKubernetesInstance from "../instances/kafkaKubernetes";
import KafkaSecret from "../secrets/kafka";
import {AIActionAgent, AIActionType} from "../agents/aiAction";

export default class HuggingfaceCompletionExampleApplication extends StreamingApplication {
  constructor(snippetsDirPath: string) {
    const module = {
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
      pipeline: [
        new AIActionAgent(AIActionType.aiChatCompletions, snippetsDirPath)
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
    };

    const instance = new KafkaKubernetesInstance();

    const configuration = {
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

    const secrets = [
      {
        name: "hugging-face",
        id: "hugging-face",
        data: {
          "access-key": ""
        },
      },
      new KafkaSecret()
    ];

    super("Hugging face completions", module, instance, configuration, secrets);
  }
}