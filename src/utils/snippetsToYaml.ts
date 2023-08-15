import * as fs from "fs";
import * as yaml from "yaml";
import {PathLike} from "fs";

export function snippetToYaml(snippetsFile: PathLike, snippetPrefixKey:string): yaml.Document{
  const f = fs.readFileSync(snippetsFile);

  const json = JSON.parse(f.toString()) as {[p:string]: {prefix:string[], description:string, body:string[]}};
  let snippetLines:string[] = [];

  Object.keys(json).forEach((key) => {
    const prefixes = json[key].prefix;
    if(prefixes.indexOf(snippetPrefixKey) < 0){
      return;
    }

    snippetLines = json[key].body;
  });

  const yamlStr:string = snippetLines.join("\n")
    .replace(/\t/gi,"  ")
    .replace(/\${LINE_COMMENT}/gi,"#");

  return yaml.parseDocument(yamlStr);
}