import AgentSnippet from "./agentSnippet";
import * as path from "path";
import {snippetToYaml} from "../../utils/snippetsToYaml";

export enum AIActionType {
  aiChatCompletions = "ai-chat-completions",
  computeAiEmbeddings = "compute-ai-embeddings",
  languageDetector = "language-detector"
}

export class AIActionAgent extends AgentSnippet {
  constructor(actionType:AIActionType, snippetsDirPath: string) {
    const snippetsFilePath = path.join(snippetsDirPath,'ai-actions-yaml.json');
    const snippetYamlDocument = snippetToYaml(snippetsFilePath, actionType);
    super(snippetYamlDocument);
  }
}