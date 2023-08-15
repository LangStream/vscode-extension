import AgentSnippet from "./agentSnippet";
import * as path from "path";
import {snippetToYaml} from "../../utils/snippetsToYaml";

export enum TextProcessorActionType {
  documentToJson = "document-to-json",
  query = "query",
  textExtractor = "text-extractor",
  textNormaliser = "text-normaliser",
  textSplitter = "text-splitter"
}

export class TextProcessorAgent extends AgentSnippet {
  constructor(actionType:TextProcessorActionType, snippetsDirPath: string) {
    const snippetsFilePath = path.join(snippetsDirPath,'text-processors-yaml.json');
    const snippetYamlDocument = snippetToYaml(snippetsFilePath, actionType);
    super(snippetYamlDocument);
  }
}