/* eslint @typescript-eslint/naming-convention: 0 */
import StreamingApplication from "../streamingApplication";
import {AIActionAgent, AIActionType} from "../agents/aiAction";
import KafkaKubernetesInstance from "../instances/kafkaKubernetes";
import KafkaSecret from "../secrets/kafka";
import {Pipeline} from "../../services/controlPlaneApi/gen";

export default class ComputeOpenAIEmbeddingsExampleApplication extends StreamingApplication {
  constructor(snippetsDirPath: string) {
    const module = {
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
      pipeline: [
        new class implements Pipeline {
          name = "cassandra-sink";
          agents = [
            new AIActionAgent(AIActionType.computeAiEmbeddings, snippetsDirPath)
              .setInput("input-topic")
              .setOutput("output-topic")
              .setConfigurationValue("model", "text-embedding-ada-002")
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
          "url": ""
        },
      },
      new KafkaSecret()
    ];

    super("Open AI embeddings", module, instance, configuration, secrets);
  }
}