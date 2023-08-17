import StreamingApplication from "../streamingApplication";
import KafkaKubernetesInstance from "../instances/kafkaKubernetes";
import KafkaSecret from "../secrets/kafka";
import SimpleConsumeGateway from "../gateways/simpleConsume";
import {CustomPythonAgent, CustomPythonType} from "../agents/customPython";

export default class PythonSourceScaffoldExampleApplication extends StreamingApplication {
  public constructor(baseSnippetsDir: string) {
    const module = {
      name: "Custom Python Source",
      topics: [
        {
          "name": "output-topic",
          "creation-mode": "create-if-not-exists"
        }
      ],
      pipeline: [
        new CustomPythonAgent(CustomPythonType.pythonSource, baseSnippetsDir)
          .setInput(null)
          .setOutput("output-topic")
          .setConfigurationValue("className", "example.ExampleSource")
          .setConfigurationValue("endpoint", "https://example.com")
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
      new SimpleConsumeGateway()
    ];
    const python = `
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
`;

    super("Python source scaffolding", module, instance, configuration, secrets, gateways, python);
  }
}