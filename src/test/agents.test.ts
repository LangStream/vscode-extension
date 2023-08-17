import {describe} from "mocha";
import * as fs from "fs";
import * as yaml from "yaml";
import {Document, YAMLMap, YAMLSeq} from "yaml";
import {expect} from "chai";
import {AgentConfiguration} from "../services/controlPlaneApi/gen";

describe('',() => {
  let agentSequence:YAMLSeq;
  let agentDocument:Document;

  beforeEach(() => {
    const f = fs.readFileSync("C:\\Users\\ddieruf\\source\\LangStream\\vscode-extension\\snippets\\ai-actions-yaml.json");

    const json = JSON.parse(f.toString());
    const yamlStr:string = json["AI chat completion"].body.join("\n")
                                                .replace(/\t/gi,"  ")
                                                .replace(/\${LINE_COMMENT}/gi,"#");

    agentDocument = yaml.parseDocument(yamlStr);
    const seq = <YAMLSeq>agentDocument.contents;
    agentSequence= <YAMLMap>seq.items[0];
  });

  it('should retrieve yaml', () => {
    agentSequence.set('input', "11111");
    agentSequence.set('output', "2222");

    const configSeq = <YAMLMap>agentSequence.get('configuration');
    configSeq.set('model', '333');
    configSeq.set('messages', [{role: "8888", content: "77777"}]);

    expect(agentDocument.toString()).to.contain("input: \"11111\"");
    expect(agentDocument.toString()).to.contain("output: \"2222\"");
    expect(agentDocument.toString()).to.contain("model: \"333\"");

    const js = agentDocument.toJS();
    const agentConfig = <AgentConfiguration>js[0];
    expect(agentConfig.input).to.equal("11111");
  });
});