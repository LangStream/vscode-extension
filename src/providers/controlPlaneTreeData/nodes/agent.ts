import * as vscode from "vscode";
import * as Constants from "../../../common/constants";
import {TAllExplorerNodeTypes} from "../../../types/tAllExplorerNodeTypes";
import MessageNode from "./message";
import * as lsModels from "../../../services/controlPlaneApi/gen/models";
import {IErrorNode} from "./error";
import {IPipelineNode} from "./pipeline";
import * as path from "path";

export interface IAgentNode extends vscode.TreeItem {
  readonly agent: lsModels.AgentConfiguration;
}

export class AgentNode extends vscode.TreeItem implements IAgentNode {
  constructor(readonly agent: lsModels.AgentConfiguration) {
    super("unknown", vscode.TreeItemCollapsibleState.None);
    this.description = `Agent`;
    this.contextValue = Constants.CONTEXT_VALUES.agent;
    this.label = this.decideLabel(agent);

    switch(agent.errors?.retries ?? 0) {
      case 0:
        this.iconPath = {
          light: path.join(__dirname, "..", "images", "light", "agent-green.png"),
          dark: path.join(__dirname, "..", "images", "dark", "agent-green.png")
        };
        break;
      default:
        this.iconPath = {
          light: path.join(__dirname, "..", "images", "light", "agent-yellow.png"),
          dark: path.join(__dirname, "..", "images", "dark", "agent-yellow.png")
        };
        break;
    }
  }

  private decideLabel(agent: lsModels.AgentConfiguration): string {
    const name: string | undefined | null = agent.name?.trim()
      .replace(/'null'/g, "")
      .replace(/"null"/g, "")
      .replace(/^\bnull\b$/i, "")
      .replace(/"/g, "")
      .replace(/'/g, "")
      .replace(/`/g, "");

    const id: string | undefined | null = agent.id?.trim()
      .replace(/'null'/g, "")
      .replace(/"null"/g, "")
      .replace(/^\bnull\b$/i, "")
      .replace(/"/g, "")
      .replace(/'/g, "")
      .replace(/`/g, "");

    if(name !== undefined && name !== null && name.length > 0){
      return name;
    }

    if(id !== undefined && id !== null && id.length > 0){
      return id;
    }

    return "unknown";
  }
}

export default class AgentTree {
  public async getChildren(pipelineNode: IPipelineNode): Promise<TAllExplorerNodeTypes[]> {
    if(!pipelineNode) { return []; }

    if((pipelineNode.pipeline?.agents ?? 0) === 0) {
      return [new MessageNode(Constants.ExplorerMessageTypes.noAgents)];
    }

    const agentNodes: (IAgentNode|IErrorNode)[] = [];

    for(const agent of pipelineNode.pipeline.agents!) {
      agentNodes.push(new AgentNode(agent));
    }

    return agentNodes;
  }
}