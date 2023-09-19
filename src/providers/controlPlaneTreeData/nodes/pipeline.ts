import * as vscode from "vscode";
import * as Constants from "../../../common/constants";
import {TAllExplorerNodeTypes} from "../../../types/tAllExplorerNodeTypes";
import MessageNode from "./message";
import {IErrorNode} from "./error";
import {IModuleNode} from "./module";
import {TSavedControlPlane} from "../../../types/tSavedControlPlane";
import {IPipeline} from "../../../interfaces/iPipeline";
import {ExecutorDescription} from "../../../services/controlPlaneApi/gen";

export interface IPipelineNode extends vscode.TreeItem {
  readonly pipeline: IPipeline;
  readonly controlPlane: TSavedControlPlane;
  readonly tenantName: string;
  readonly applicationId: string;
  readonly executors: ExecutorDescription[];
}

export class PipelineNode extends vscode.TreeItem implements IPipelineNode {
  constructor(readonly pipeline: IPipeline, readonly controlPlane: TSavedControlPlane, readonly tenantName: string, readonly applicationId: string, readonly executors: ExecutorDescription[]) {
    super("unknown", vscode.TreeItemCollapsibleState.Collapsed);
    this.description = `Pipeline`;
    this.contextValue = `${Constants.CONTEXT_VALUES.pipeline}.${(pipeline.errors?.retries ?? 0) > 0 ? "errors" : "healthy"}`;
    this.label = this.decideLabel(pipeline);
  }

  private decideLabel(pipeline: IPipeline): string {
    const name: string | undefined | null = pipeline.name?.trim()
                  .replace(/'null'/g, "")
                  .replace(/"null"/g, "")
                  .replace(/^\bnull\b$/i, "")
                  .replace(/"/g, "")
                  .replace(/'/g, "")
                  .replace(/`/g, "");

    const id: string | undefined | null = pipeline.id?.trim()
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

export default class PipelineTree {
  constructor(private readonly controlPlane: TSavedControlPlane, private readonly tenantName: string, private readonly applicationId: string) {  }
  public async getChildren(moduleNode: IModuleNode): Promise<TAllExplorerNodeTypes[]> {
    if(!moduleNode) { return []; }

    if((moduleNode.pipelines?.length ?? 0) === 0) {
      return [new MessageNode(Constants.ExplorerMessageTypes.noPipelines)];
    }

    const pipelineNodes: (IPipelineNode|IErrorNode)[] = [];

    for(const pipeline of moduleNode.pipelines) {
      pipelineNodes.push(new PipelineNode(pipeline, this.controlPlane, this.tenantName, this.applicationId, pipeline.executors ?? []));
    }

    return pipelineNodes;
  }
}