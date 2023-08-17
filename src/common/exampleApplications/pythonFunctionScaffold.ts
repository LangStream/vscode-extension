import StreamingApplication from "../streamingApplication";
import KafkaKubernetesInstance from "../instances/kafkaKubernetes";
import KafkaSecret from "../secrets/kafka";
import SimpleConsumeGateway from "../gateways/simpleConsume";
import {CustomPythonAgent, CustomPythonType} from "../agents/customPython";
import SimpleProduceGateway from "../gateways/simpleProduce";

export default class PythonFunctionScaffoldExampleApplication extends StreamingApplication {
  public constructor(baseSnippetsDir: string) {
    const module = {
      name: "Custom Python Function",
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
        new CustomPythonAgent(CustomPythonType.pythonFunction, baseSnippetsDir)
          .setInput("input-topic")
          .setOutput("output-topic")
          .setConfigurationValue("className", "example.Exclamation")
          .asAgentConfiguration(),
      ]
    };
    const instance = new KafkaKubernetesInstance();
    const configuration = {
      resources: [],
      dependencies: []
    };
    const secrets = [
      new KafkaSecret()
    ];
    const gateways = [
      new SimpleProduceGateway("input-topic"),
      new SimpleConsumeGateway("output-topic")
    ];
    const python = `
from langstream.util import SimpleRecord, SingleRecordProcessor

# Example Python processor that adds an exclamation mark to the end of the record value
class Exclamation(SingleRecordProcessor):
  def process_record(self, record):
      return [SimpleRecord(record.value() + "!!")]  
`;

    super("Python function scaffolding", module, instance, configuration, secrets, gateways, python);
  }
}