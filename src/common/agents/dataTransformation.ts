import AgentSnippet from "./agentSnippet";
import * as path from "path";
import {snippetToYaml} from "../../utils/snippetsToYaml";

export enum DataTransformationActionType {
  cast = 'cast',
  compute = 'compute',
  drop = 'drop',
  dropFields = 'dropF-fields',
  flatten = 'flatten',
  mergeKeyValue = 'merge-key-value',
  unwrapKeyValue = 'unwrap-key-value',
}

export class DataTransformationAgent extends AgentSnippet {
  constructor(actionType:DataTransformationActionType, snippetsDirPath: string) {
    const snippetsFilePath = path.join(snippetsDirPath,'data-transformation-yaml.json');
    const snippetYamlDocument = snippetToYaml(snippetsFilePath, actionType);
    super(snippetYamlDocument);
  }
}