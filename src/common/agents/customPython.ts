import AgentSnippet from "./agentSnippet";
import * as path from "path";
import {snippetToYaml} from "../../utils/snippetsToYaml";

export enum CustomPythonType {
  pythonSource = "python-source",
  pythonSink = "python-sink",
  pythonFunction = "python-function"
}

export class CustomPythonAgent extends AgentSnippet {
  constructor(actionType:CustomPythonType, snippetsDirPath: string) {
    const snippetsFilePath = path.join(snippetsDirPath,'custom-python-yaml.json');
    const snippetYamlDocument = snippetToYaml(snippetsFilePath, actionType);
    super(snippetYamlDocument);
  }
}