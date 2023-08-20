import KafkaKubernetesInstance from "../instances/kafkaKubernetes";
import KafkaSecret from "../secrets/kafka";
import S3Secret from "../secrets/s3";
import {InputOutputActionType, InputOutputAgent} from "../agents/inputOutput";
import {IExampleApplication} from "../../interfaces/iExampleApplication";

export default class S3SourceExampleApplication implements IExampleApplication {
  constructor(private readonly snippetsDirPath: string) {}
  public get exampleApplicationName(){
    return "AWS S3 source";
  }
  public get configuration() {
    return {
      resources: [],
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
        name: "AWS S3 data source",
        topics: [{
          name: "output-topic",
          // eslint-disable-next-line @typescript-eslint/naming-convention
          "creation-mode": "create-if-not-exists"
        }],
        pipelines: [
          new InputOutputAgent(InputOutputActionType.s3Source, this.snippetsDirPath)
            .setInput(null)
            .setOutput("output-topic")
            .setConfigurationValue("bucketName", "{{{secrets.aws-s3.bucket-name}}}")
            .setConfigurationValue("endpoint", "{{{secrets.aws-s3.endpoint}}}")
            .setConfigurationValue("access-key", "{{{secrets.aws-s3.access-key}}}")
            .setConfigurationValue("secret-key", "{{{secrets.aws-s3.secret}}}")
            .setConfigurationValue("region", "{{{secrets.aws-s3.region}}}")
            .setConfigurationValue("idle-time", 5)
            .asAgentConfiguration()
        ]
      }
    ];
  }
  public get secrets() {
    return [
      new KafkaSecret(),
      new S3Secret()
    ];
  }
}