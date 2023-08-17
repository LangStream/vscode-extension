/* eslint @typescript-eslint/naming-convention: 0 */
import StreamingApplication from "../streamingApplication";
import KafkaKubernetesInstance from "../instances/kafkaKubernetes";
import KafkaSecret from "../secrets/kafka";
import {AIActionAgent, AIActionType} from "../agents/aiAction";
import {Pipeline} from "../../services/controlPlaneApi/gen";

export default class OpenAICompletionExampleApplication extends StreamingApplication {
  constructor(snippetsDirPath: string) {
    const module = {
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
      pipeline: [
        new class implements Pipeline {
          name = "cassandra-sink";
          agents = [
        new AIActionAgent(AIActionType.aiChatCompletions, snippetsDirPath)
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
          ];
        }
      ]
    };
    const instance = new KafkaKubernetesInstance();

    const configuration = {
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

    const secrets = [
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

    super("OpenAI completions", module, instance, configuration, secrets);
  }
}