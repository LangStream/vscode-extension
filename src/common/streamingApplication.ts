/* eslint @typescript-eslint/naming-convention: 0 */
import {
  AgentConfiguration,
  Application, ComputeCluster, Dependency, Gateway,
  Pipeline, Resource, Secret, StreamingCluster,
  TopicDefinition
} from "../services/controlPlaneApi/gen";
import * as path from "path";
import * as YAML from "yaml";
import * as fs from "fs";
import Logger from "./logger";

export default class StreamingApplication {
  private readonly module;
  private readonly configuration;
  private readonly instance;
  private readonly secrets;
  private readonly gateways;

  constructor(module:{ pipeline: AgentConfiguration[]; topics: TopicDefinition[]; name: string; },
              instance: { computeCluster: ComputeCluster; streamingCluster: StreamingCluster; globals?: { [p: string]: object } },
              configuration: { resources: any[]; dependencies: any[] } = {resources:[], dependencies:[]},
              secrets: any[] = [],
              gateways: any[] = []) {
    this.module = module;
    this.configuration = configuration;
    this.instance = instance;
    this.secrets = secrets;
    this.gateways = gateways;
  }

  public get Module() { return this.module; }
  public get Configuration() { return this.configuration; }
  public get Instance() { return this.instance; }
  public get Secrets() { return this.secrets; }
  public get Gateways() { return this.gateways; }

  public static fromInstance(instance: Application): StreamingApplication {
    if(instance.modules === undefined){
      throw new Error("Error converting from instance, no modules found");
    }

    const moduleKeys = Object.keys(instance.modules);

    if(moduleKeys.length === 0){
      throw new Error("Error converting from instance, no modules found");
    }

    const module = instance.modules[moduleKeys[0]]; //At this point there is only one module expected

    if(module.id === undefined){
      throw new Error("The id of the module is required, but no value was provided");
    }

    return new StreamingApplication(
      {
        name: moduleKeys[0],
        topics: Object.keys(module.topics || {}).map((topicKey) => {
          return module.topics![topicKey];
        }),
        pipeline: Object.keys(module.pipelines || {}).map((pipelineKey) => {
          return module.pipelines![pipelineKey];
        })
      },
    {
      globals: instance.instance?.globals,
      streamingCluster: instance.instance?.streamingCluster || {},
      computeCluster: instance.instance?.computeCluster || {}
    },
      {
      resources: Object.keys(instance.resources || {}).map((resourceKey) => {
        return instance.resources![resourceKey];
      }),
      dependencies: instance.dependencies || []
    },
      Object.keys(instance.secrets?.secrets || {}).map((secretKey) => {
      return instance.secrets?.secrets![secretKey] || {};
    }),
      instance.gateways?.gateways
    );
  }

/*  private asApplication(): Application {
    let resc = [];
    let secs = [];

    // Assume an application will always at least 1 topic
    if(this.module.topics.length === 0){
      throw new Error("An application must have at least one topic");
    }

    // Assume an application will always at least 1 pipeline
    if(this.module.pipeline.length === 0){
      throw new Error("An application must have at least one pipeline");
    }

    if(this.configuration.resources.length > 0) {
      this.configuration.resources.forEach((resource) => {

      });
      resc = this.configuration.resources.reduce(((resource) => ({...resource, [<string>resource.id]: resource})));
    }

    if(this.secrets.length > 0) {
      secs = this.secrets.reduce(((secret) => ({...secret, [<string>secret.id]: secret})));
    }

    return {
      dependencies: this.configuration.dependencies,
      gateways: { gateways: this.gateways },
      instance: this.instance,
      modules: {
        module: {
          topics: { topics: this.module.topics.reduce(((topic) => ({ ...topic, [<string>topic.name]: topic}))) },
          //pipeline: this.module.pipeline
        }
      },
      resources: { resources: resc },
      secrets: { secrets: secs }
    };
  }*/

  private asSingleYaml(): string {
    const d = new YAML.Document();
    d.add(this.secrets);
    d.add("---");
    d.add(this.configuration);
    d.add("---");
    d.add(this.module);

    return d.toString();
  }

  public writeAsFiles(applicationFolder: string): [string, fs.PathLike][] {
    const applicationFolderPath = path.join(applicationFolder, "application");
    const modulePath = path.join(applicationFolderPath.toLowerCase(), "pipeline.yaml");
    const configurationPath = path.join(applicationFolderPath.toLowerCase(), "configuration.yaml");
    const gatewaysPath = path.join(applicationFolderPath.toLowerCase(), "gateways.yaml");
    const instancePath = path.join(applicationFolder, "instance.yaml");
    const secretsPath = path.join(applicationFolder, "secrets.yaml");

    const opts:fs.WriteFileOptions = {encoding: "utf8", flag: "w"};

    const shouldCreateConfiguration = ((this.configuration?.dependencies?.length ?? 0 > 0)
      || (this.configuration?.resources?.length ?? 0 > 0));
    const shouldCreateSecrets = (this.secrets?.length ?? 0 > 0);
    const shouldCreateGateways = (this.gateways?.length ?? 0 > 0);

    const yamlToString:YAML.ToStringOptions = {
      indent: 2,
      doubleQuotedAsJSON: true,
      doubleQuotedMinMultiLineLength: 400,
      lineWidth: 0,
      minContentWidth: 0
    };

    // Validate the destination doesn't already have an app
    if(fs.existsSync(applicationFolderPath)){
      throw new Error("Selected folder already has an 'application' folder");
    }

    if(fs.existsSync(modulePath)){
      throw new Error("Selected folder already has a pipeline specified");
    }

    if(fs.existsSync(instancePath)){
      throw new Error("Selected folder already has instance specified");
    }

    if(shouldCreateGateways && fs.existsSync(gatewaysPath)){
      throw new Error("Selected folder already has gateways specified");
    }

    if(shouldCreateConfiguration && fs.existsSync(configurationPath)){
      throw new Error("Selected folder already has configuration specified");
    }

    if(shouldCreateSecrets && fs.existsSync(secretsPath)){
      throw new Error("Selected folder already has secrets specified");
    }

    try{
      fs.mkdirSync(applicationFolderPath, {recursive: true});
    }catch (e:any) {
      Logger.error("Error creating application folder", e);
      throw new Error(`Error creating application folder, ${e.message}`);
    }

    fs.writeFileSync(modulePath, YAML.stringify(this.module, null, yamlToString), opts);

    fs.writeFileSync(instancePath, YAML.stringify({instance: this.instance}, null, yamlToString), opts);

    if(shouldCreateGateways){
      fs.writeFileSync(gatewaysPath, YAML.stringify({gateways: this.gateways}, null, yamlToString), opts);
    }

    if(shouldCreateConfiguration){
      fs.writeFileSync(configurationPath, YAML.stringify({configuration: this.configuration}, null, yamlToString), opts);
    }

    if(shouldCreateSecrets){
      fs.writeFileSync(secretsPath, YAML.stringify({secrets: this.secrets}, null, yamlToString), opts);
    }

    const returnPaths:[string, fs.PathLike][] = [
      ["application/pipeline.yaml", modulePath],
      ["instance.yaml", instancePath]
    ];

    if(shouldCreateGateways){
      returnPaths.push( ["application/gateways.yaml", gatewaysPath]);
    }

    if(shouldCreateConfiguration){
      returnPaths.push( ["application/configuration.yaml", configurationPath]);
    }

    if(shouldCreateSecrets){
      returnPaths.push( ["secrets.yaml", secretsPath]);
    }

    return returnPaths;
  }
}