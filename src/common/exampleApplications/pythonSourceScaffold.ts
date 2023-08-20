import KafkaKubernetesInstance from "../instances/kafkaKubernetes";
import KafkaSecret from "../secrets/kafka";
import SimpleConsumeGateway from "../gateways/simpleConsume";
import {CustomPythonAgent, CustomPythonType} from "../agents/customPython";
import {IExampleApplication} from "../../interfaces/iExampleApplication";

export default class PythonSourceScaffoldExampleApplication implements IExampleApplication {
  constructor(private readonly snippetsDirPath: string) {}
  public get exampleApplicationName(){
    return "Python source scaffolding";
  }
  public get configuration() {
    return {
      resources: [],
      dependencies: []
    };
  }
  public get gateways() {
    return [
      new SimpleConsumeGateway()
    ];
  }
  public get instance() {
    return  new KafkaKubernetesInstance();
  }
  public get modules() {
    return [
      {
      name: "Custom Python Source",
      topics: [
      {
        "name": "output-topic",
        "creation-mode": "create-if-not-exists"
      }
    ],
      pipelines: [
      new CustomPythonAgent(CustomPythonType.pythonSource, this.snippetsDirPath)
        .setInput(null)
        .setOutput("output-topic")
        .setConfigurationValue("className", "example.ExampleSource")
        .setConfigurationValue("endpoint", "https://example.com")
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
import time
from typing import List
from sga_runtime.api import Source, Record
from sga_runtime.simplerecord import SimpleRecord

class ExampleSource(Source):
   # initialize the application
    def init(self, config):
        # example input arg
        endpoint_url = config.get('endpoint')

    # read from the source
    def read(self) -> List[Record]:
        # sleep the source for 1 second
        time.sleep(1)
        
        # add example headers to message
        headers = []
        headers.append(('string', 'header-string'))

        # return a list of records that will be produced to the output topic
        return [ SimpleRecord(f'This is a record', headers=headers), SimpleRecord(f'This is another record', headers=headers) ]


    # finalize the read
    def commit(self, records: List[Record]):
        pass
`
      }
    ];
  };
}