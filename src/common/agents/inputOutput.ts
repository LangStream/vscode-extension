import AgentSnippet from "./agentSnippet";
import * as path from "path";
import {snippetToYaml} from "../../utils/snippetsToYaml";

export enum InputOutputActionType {
  s3Source = "s3-source",
  sink = "sink",
  cassandraSink = "cassandra-sink"
}

export class InputOutputAgent extends AgentSnippet {
  constructor(actionType:InputOutputActionType, snippetsDirPath: string) {
    const snippetsFilePath = path.join(snippetsDirPath,'input-output-yaml.json');
    const snippetYamlDocument = snippetToYaml(snippetsFilePath, actionType);
    super(snippetYamlDocument);
  }
}