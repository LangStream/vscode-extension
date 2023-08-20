import KafkaKubernetesInstance from "../instances/kafkaKubernetes";
import KafkaSecret from "../secrets/kafka";
import SimpleConsumeGateway from "../gateways/simpleConsume";
import {CustomPythonAgent, CustomPythonType} from "../agents/customPython";
import SimpleProduceGateway from "../gateways/simpleProduce";
import {IExampleApplication} from "../../interfaces/iExampleApplication";

export default class PythonFunctionScaffoldExampleApplication implements IExampleApplication {
  constructor(private readonly snippetsDirPath: string) {}
  public get exampleApplicationName(){
    return "Python function scaffolding";
  }
  public get configuration() {
    return {
      resources: [],
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
        pipelines: [
          new CustomPythonAgent(CustomPythonType.pythonFunction, this.snippetsDirPath)
            .setInput("input-topic")
            .setOutput("output-topic")
            .setConfigurationValue("className", "example.Exclamation")
            .asAgentConfiguration(),
        ]
      }
    ];
  }
  public get secrets() {
    return [
      new KafkaSecret()
    ];
  }
  public get artifactFiles() {
    return [
      {
        artifactFilePath: 'python/example.py',
        srcCode: `
from langstream.util import SimpleRecord, SingleRecordProcessor

# Example Python processor that adds an exclamation mark to the end of the record value
class Exclamation(SingleRecordProcessor):
  def process_record(self, record):
      return [SimpleRecord(record.value() + "!!")]  
`}
    ];
  }
}