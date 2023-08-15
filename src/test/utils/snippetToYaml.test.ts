import {snippetToYaml} from "../../utils/snippetsToYaml";
import {expect} from "chai";
import * as yaml from "yaml";

describe("Snippet to yaml tests", () => {
  let snippetsFolderPath = "c:\\Users\\ddieruf\\source\\riptano\\streaming-gen-ai-vscode\\snippets\\input-output-yaml.json";

  it("should convert snippet to yaml", async () => {
    const snippetYamlDocument = snippetToYaml(snippetsFolderPath, "s3-source");
    expect(snippetYamlDocument).to.not.be.null;
    expect(snippetYamlDocument.contents).to.not.be.null;

    const contents = <yaml.YAMLSeq>snippetYamlDocument.contents;
    expect(contents.items).to.have.a.lengthOf(1);

    const baseSeq = <yaml.YAMLSeq>contents.items[0];

    const inputSeq = baseSeq.get('input');
    expect(inputSeq).to.be.undefined;

    const outputSeq = baseSeq.get('output');
    expect(outputSeq).to.not.be.undefined;
    expect(outputSeq).to.equal('output-topic');

    const configSeq = baseSeq.get('configuration');
    expect(configSeq).to.not.be.undefined;
  });
});