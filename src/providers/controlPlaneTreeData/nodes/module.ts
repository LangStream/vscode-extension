import * as vscode from "vscode";
import * as Constants from "../../../common/constants";
import {TAllExplorerNodeTypes} from "../../../types/tAllExplorerNodeTypes";
import MessageNode from "./message";
import * as lsModels from "../../../services/controlPlaneApi/gen/models";
import {IErrorNode} from "./error";

export interface IModuleNode extends vscode.TreeItem {
  readonly pipelines: lsModels.Pipeline[];
  readonly topics: lsModels.TopicDefinition[];
}

export class ModuleNode extends vscode.TreeItem implements IModuleNode {
  constructor(readonly label: string,
              readonly pipelines: lsModels.Pipeline[],
              readonly topics: lsModels.TopicDefinition[]) {

    super(label, vscode.TreeItemCollapsibleState.Collapsed);
    this.description = `Module`;
    this.contextValue = Constants.CONTEXT_VALUES.module;
  }
}

export default class ModuleTree {
  public async getChildren(modules: lsModels.ModuleDefinition[]): Promise<TAllExplorerNodeTypes[]> {
    if(modules.length === 0) {
      return [new MessageNode(Constants.ExplorerMessageTypes.noModules)];
    }

    const moduleNodes: (IModuleNode|IErrorNode)[] = [];

    for(const module of modules) {
      moduleNodes.push(new ModuleNode(module.id ?? "unknown", module.pipelines ?? [], module.topics ?? []));
    }

    return moduleNodes;
  }
}