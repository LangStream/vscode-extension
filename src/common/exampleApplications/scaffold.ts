import KafkaKubernetesInstance from "../instances/kafkaKubernetes";
import KafkaSecret from "../secrets/kafka";
import SimpleProduceGateway from "../gateways/simpleProduce";
import SimpleConsumeGateway from "../gateways/simpleConsume";
import {IExampleApplication} from "../../interfaces/iExampleApplication";

export default class ScaffoldExampleApplication implements IExampleApplication {
  constructor() {}
  public get exampleApplicationName(){
    return "Basic scaffolding";
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
        name: "LangStream application scaffolding",
        topics: [{
          name: "input-topic",
          "creation-mode": "create-if-not-exists"
        },{
          name: "output-topic",
          "creation-mode": "create-if-not-exists"
        }],
        pipelines: []
      }
    ];
  }
  public get secrets() {
    return [
      new KafkaSecret()
    ];
  }
}