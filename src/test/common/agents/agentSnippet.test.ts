import {expect} from "chai";
import {snippetToYaml} from "../../../utils/snippetsToYaml";
import AgentSnippet from "../../../common/agents/agentSnippet";

describe("Agent snippet tests", () => {
  let snippetsFolderPath = "c:\\Users\\ddieruf\\source\\riptano\\streaming-gen-ai-vscode\\snippets\\ai-actions-yaml.json";
  let agentSnippet: AgentSnippet;

  beforeEach(() => {
    const snippetYamlDocument = snippetToYaml(snippetsFolderPath, "ai-chat-completions");
    expect(snippetYamlDocument).to.not.be.null;

    agentSnippet = new AgentSnippet(snippetYamlDocument);
    expect(agentSnippet).to.not.be.null;
  });

  it("should create an agent snippet with no input or output", async () => {
    agentSnippet.setInput(null);
    agentSnippet.setOutput(null);

    const agentConfig = agentSnippet.asAgentConfiguration();
    expect(agentConfig.input).to.be.undefined;
    expect(agentConfig.output).to.be.undefined;
  });

  it("should create an agent snippet with input and output set", async () => {
    agentSnippet.setInput("aaaa");
    agentSnippet.setOutput("bbbb");

    const agentConfig = agentSnippet.asAgentConfiguration();
    expect(agentConfig.input).to.equal("aaaa");
    expect(agentConfig.output).to.equal("bbbb");
  });
});