import * as vscode from "vscode";
import * as Constants from "../../../common/constants";
import {TAllExplorerNodeTypes} from "../../../types/tAllExplorerNodeTypes";
import MessageNode from "./message";
import * as lsModels from "../../../services/controlPlaneApi/gen/models";
import {IErrorNode} from "./error";
import {IModuleNode} from "./module";

export interface IPipelineNode extends vscode.TreeItem {
  readonly pipeline: lsModels.Pipeline;
}

export class PipelineNode extends vscode.TreeItem implements IPipelineNode {
  constructor(readonly pipeline: lsModels.Pipeline) {
    super(pipeline.name ?? "unknown", vscode.TreeItemCollapsibleState.Collapsed);
    this.description = `Pipeline`;
    this.contextValue = `${Constants.CONTEXT_VALUES.pipeline}.${(pipeline.errors?.retries ?? 0) > 0 ? "errors" : "healthy"}`;
  }
}

export default class PipelineTree {
  public async getChildren(moduleNode: IModuleNode): Promise<TAllExplorerNodeTypes[]> {
    if(!moduleNode) { return []; }

    if((moduleNode.pipelines?.length ?? 0) === 0) {
      return [new MessageNode(Constants.ExplorerMessageTypes.noPipelines)];
    }

    const pipelineNodes: (IPipelineNode|IErrorNode)[] = [];

    for(const pipeline of moduleNode.pipelines) {
      pipelineNodes.push(new PipelineNode(pipeline));
    }

    return pipelineNodes;
  }
}