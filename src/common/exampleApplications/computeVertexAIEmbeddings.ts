/* eslint @typescript-eslint/naming-convention: 0 */
import StreamingApplication from "../streamingApplication";
import {AIActionAgent, AIActionType} from "../agents/aiAction";
import KafkaKubernetesInstance from "../instances/kafkaKubernetes";
import KafkaSecret from "../secrets/kafka";
import {Pipeline} from "../../services/controlPlaneApi/gen";

export default class ComputeVertexEmbeddingsExampleApplication extends StreamingApplication {
  constructor(snippetsDirPath: string) {
    const module = {
      name: "Compute embeddings example application using Vertex AI",
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
          .setConfigurationValue("model", "textembedding-gecko")
          .setConfigurationValue("embeddings-field", "value.embeddings")
          .setConfigurationValue("text", "{{% value.name }} {{% value.description }}")
          .asAgentConfiguration()
          ];
        }
      ]
    };
    const instance = new KafkaKubernetesInstance();
    const configuration = {
      resources: [
        {
          type: "vertex-configuration",
          name: "Google Vertex AI configuration",
          configuration: {
            url: "{{ secrets.vertex-ai.url }}",
            serviceAccountJson: "{{{ secrets.vertex-ai.serviceAccountJson }}}",
            token: "{{ secrets.vertex-ai.token }}",
            region: "{{ secrets.vertex-ai.region }}",
            project: "{{ secrets.vertex-ai.project }}",
          }
        }
      ],
      dependencies: []
    };
    const secrets = [
      {
        name: "vertex-ai",
        id: "vertex-ai",
        data: {
          url: "https://us-central1-aiplatform.googleapis.com",
          token: "",
          serviceAccountJson: "",
          region: "us-central1",
          project: "myproject"
        },
      },
      new KafkaSecret()
    ];

    super(module, instance, configuration, secrets);
  }
}