import * as vscode from "vscode";
import * as Constants from "../../../common/constants";
import {TAllExplorerNodeTypes} from "../../../types/tAllExplorerNodeTypes";
import MessageNode from "./message";
import * as lsModels from "../../../services/controlPlaneApi/gen/models";
import {IErrorNode} from "./error";
import {TSavedControlPlane} from "../../../types/tSavedControlPlane";
import {IModule} from "../../../interfaces/iModule";
import {IPipeline} from "../../../interfaces/iPipeline";

export interface IModuleNode extends vscode.TreeItem {
  readonly pipelines: IPipeline[];
  readonly topics: lsModels.TopicDefinition[];
  readonly controlPlane: TSavedControlPlane;
  readonly tenantName: string;
  readonly applicationId: string;
}

export class ModuleNode extends vscode.TreeItem implements IModuleNode {
  constructor(readonly label: string,
              readonly pipelines: IPipeline[],
              readonly topics: lsModels.TopicDefinition[],
              readonly controlPlane: TSavedControlPlane,
              readonly tenantName: string,
              readonly applicationId: string) {

    super(label, vscode.TreeItemCollapsibleState.Collapsed);
    this.description = `Module`;
    this.contextValue = Constants.CONTEXT_VALUES.module;
  }
}

export default class ModuleTree {
  constructor(private readonly controlPlane: TSavedControlPlane, private readonly tenantName: string, private readonly applicationId: string) {  }
  public async getChildren(modules: IModule[]): Promise<TAllExplorerNodeTypes[]> {
    if(modules.length === 0) {
      return [new MessageNode(Constants.ExplorerMessageTypes.noModules)];
    }

    const moduleNodes: (IModuleNode|IErrorNode)[] = [];

    for(const module of modules) {
      moduleNodes.push(new ModuleNode(module.id ?? "unknown", module.pipelines ?? [], module.topics ?? [], this.controlPlane, this.tenantName, this.applicationId));
    }

    return moduleNodes;
  }
}