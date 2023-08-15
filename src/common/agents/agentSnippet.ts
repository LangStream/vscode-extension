import * as yaml from "yaml";
import {AgentConfiguration} from "../../services/controlPlaneApi/gen";

export default class AgentSnippet {
  private readonly agentDocument: yaml.Document;
  private readonly agentSequence: yaml.YAMLMap;

  constructor(snippetYaml:yaml.Document) {
    this.agentDocument = snippetYaml;
    const seq = <yaml.YAMLSeq>this.agentDocument.contents;

    if(seq.items.length < 1){
      throw new Error('Snippet does no contents');
    }

    this.agentSequence= <yaml.YAMLMap>seq.items[0];
  }

  public setInput(topicName: string | null): AgentSnippet {
    const seq = this.agentSequence.get('input');

    if(seq === undefined && topicName === null){
      return this;
    }else if(seq === undefined){
      throw new Error('Snippet does not have input declared');
    }

    if(topicName === null){
      this.agentSequence.delete('input');
    }else{
      this.agentSequence.set('input', topicName);
    }
    return this;
  }

  public setOutput(topicName: string | null): AgentSnippet {
    const seq = this.agentSequence.get('output');

    if(seq === undefined && topicName === null){
      return this;
    }else if(seq === undefined){
      throw new Error('Snippet does not have output declared');
    }

    if(topicName === null){
      this.agentSequence.delete('output');
    }else{
      this.agentSequence.set('output', topicName);
    }
    return this;
  }

  public setConfigurationValue(key:string, value:any): AgentSnippet {
    const seq = this.agentSequence.get('configuration');

    if(seq === undefined){
      throw new Error('Snippet does not have configuration declared');
    }

    const configSeq = <yaml.YAMLMap>seq;
    configSeq.set(key, value);

    return this;
  }

  public asAgentConfiguration(): AgentConfiguration {
    try{
      const js = this.agentDocument.toJS();
      return <AgentConfiguration>js[0];
    }catch (e:any) {
      throw new Error(`Failed to convert snippet to AgentConfiguration: ${e.message}`);
    }
  }
}