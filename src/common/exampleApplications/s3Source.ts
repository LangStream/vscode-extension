import StreamingApplication from "../streamingApplication";
import KafkaKubernetesInstance from "../instances/kafkaKubernetes";
import KafkaSecret from "../secrets/kafka";
import S3Secret from "../secrets/s3";
import {InputOutputActionType, InputOutputAgent} from "../agents/inputOutput";
import {Pipeline} from "../../services/controlPlaneApi/gen";

export default class S3SourceExampleApplication extends StreamingApplication {
  constructor(snippetsDirPath: string) {
    const module = {
      name: "AWS S3 data source",
      topics: [{
        name: "output-topic",
        // eslint-disable-next-line @typescript-eslint/naming-convention
        "creation-mode": "create-if-not-exists"
      }],
      pipeline: [
        new class implements Pipeline {
          name = "cassandra-sink";
          agents = [
        new InputOutputAgent(InputOutputActionType.s3Source, snippetsDirPath)
          .setInput(null)
          .setOutput("output-topic")
          .setConfigurationValue("bucketName", "{{{secrets.aws-s3.bucket-name}}}")
          .setConfigurationValue("endpoint", "{{{secrets.aws-s3.endpoint}}}")
          .setConfigurationValue("access-key", "{{{secrets.aws-s3.access-key}}}")
          .setConfigurationValue("secret-key", "{{{secrets.aws-s3.secret}}}")
          .setConfigurationValue("region", "{{{secrets.aws-s3.region}}}")
          .setConfigurationValue("idle-time", 5)
          .asAgentConfiguration()
          ];
        }
      ]
    };
    const instance = new KafkaKubernetesInstance();
    const configuration = undefined;
    const secrets = [
      new KafkaSecret(),
      new S3Secret()
    ];

    super("AWS S3 source", module, instance, configuration, secrets);
  }
}