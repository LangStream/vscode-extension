/* eslint @typescript-eslint/naming-convention: 0 */
import {AIActionAgent, AIActionType} from "../agents/aiAction";
import KafkaKubernetesInstance from "../instances/kafkaKubernetes";
import KafkaSecret from "../secrets/kafka";
import {IExampleApplication} from "../../interfaces/iExampleApplication";

export default class ComputeVertexEmbeddingsExampleApplication implements IExampleApplication {
  constructor(private readonly snippetsDirPath: string) {}
  public get exampleApplicationName(){
    return "Compute Vertex AI embeddings";
  }
  public get configuration() {
    return {
      resources: [
        {
          type: "vertex-configuration",
          name: "Google Vertex AI configuration",
          configuration: {
            url: "{{{ secrets.vertex-ai.url }}}",
            serviceAccountJson: "{{{ secrets.vertex-ai.serviceAccountJson }}}",
            token: "{{{ secrets.vertex-ai.token }}}",
            region: "{{{ secrets.vertex-ai.region }}}",
            project: "{{{ secrets.vertex-ai.project }}}",
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
        pipelines: [
          new AIActionAgent(AIActionType.computeAiEmbeddings, this.snippetsDirPath)
            .setInput("input-topic")
            .setOutput("output-topic")
            .setConfigurationValue("model", "textembedding-gecko")
            .setConfigurationValue("embeddings-field", "value.embeddings")
            .setConfigurationValue("text", "{{{% value.name }}} {{{% value.description }}}")
            .asAgentConfiguration()
        ]
      }
    ];
  }
  public get secrets() {
    return [
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
  }
}