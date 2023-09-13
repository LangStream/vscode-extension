import {IApplication} from "../interfaces/iApplication";
import * as fs from "fs";
import * as path from "path";
import * as YAML from "yaml";
import Logger from "../common/logger";

export function writeApplicationAsFiles(applicationFolder: string, application: IApplication): [string, fs.PathLike][] {
  const applicationFolderPath = path.join(applicationFolder, "application");
  const modulePath = path.join(applicationFolderPath.toLowerCase(), "pipeline.yaml");
  const configurationPath = path.join(applicationFolderPath.toLowerCase(), "configuration.yaml");
  const gatewaysPath = path.join(applicationFolderPath.toLowerCase(), "gateways.yaml");
  const instancePath = path.join(applicationFolder, "instance.yaml");
  const secretsPath = path.join(applicationFolder, "secrets.yaml");

  const opts:fs.WriteFileOptions = {encoding: "utf8", flag: "w"};

  const shouldCreateConfiguration = ((application.configuration?.dependencies?.length ?? 0 > 0)
    || (application.configuration?.resources?.length ?? 0 > 0));
  const shouldCreateSecrets = (application.secrets?.length ?? 0 > 0);
  const shouldCreateGateways = (application.gateways?.length ?? 0 > 0);

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

  fs.writeFileSync(modulePath, YAML.stringify({
    name: application.modules[0].name,
    id: application.modules[0].id,
    topics: application.modules[0].topics,
    pipeline: application.modules[0].pipelines
  }, null, yamlToString), opts);

  fs.writeFileSync(instancePath, YAML.stringify({instance: application.instance}, null, yamlToString), opts);

  if(shouldCreateGateways){
    fs.writeFileSync(gatewaysPath, YAML.stringify({gateways: application.gateways}, null, yamlToString), opts);
  }

  if(shouldCreateConfiguration){
    fs.writeFileSync(configurationPath, YAML.stringify({configuration: application.configuration}, null, yamlToString), opts);
  }

  if(shouldCreateSecrets){
    fs.writeFileSync(secretsPath, YAML.stringify({secrets: application.secrets}, null, yamlToString), opts);
  }

  application.artifactFiles?.forEach((artifactFile) => {
    const artifactFullPath = path.join(applicationFolder, artifactFile.artifactFilePath);
    //c:\\Users\\ddieruf\\source\\langstream-applications\\python-function\\python\\example.py
    fs.writeFileSync(artifactFullPath, artifactFile.srcCode, opts);
  });

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

  application.artifactFiles?.forEach((artifactFile) => {
    returnPaths.push( [artifactFile.artifactFilePath, path.join(applicationFolder, artifactFile.artifactFilePath)]);
  });

  return returnPaths;
}