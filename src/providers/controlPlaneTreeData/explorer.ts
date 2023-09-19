import * as vscode from "vscode";
import {TAllExplorerNodeTypes} from "../../types/tAllExplorerNodeTypes";
import * as Constants from "../../common/constants";
import {ExplorerFolderTypes} from "../../common/constants";
import ConfigurationProvider from "../configuration";
import {ControlPlaneProviderTree, IControlPlaneNode} from "./nodes/controlPlane";
import TenantTree, {ITenantNode} from "./nodes/tenant";
import ApplicationTree, {IApplicationNode} from "./nodes/application";
import FolderNode from "./nodes/folder";
import ModuleTree, {IModuleNode} from "./nodes/module";
import GatewayTree from "./nodes/gateway";
import PipelineTree, {IPipelineNode} from "./nodes/pipeline";
import CompositeAgentTree from "./nodes/compositeAgent";
import {IModule} from "../../interfaces/iModule";

export default class ControlPlaneTreeDataProvider  implements vscode.TreeDataProvider<TAllExplorerNodeTypes> {
  private onDidChangeTreeDataEmitter: vscode.EventEmitter<TAllExplorerNodeTypes | undefined> = new vscode.EventEmitter<TAllExplorerNodeTypes | undefined>();
  readonly onDidChangeTreeData: vscode.Event<TAllExplorerNodeTypes | undefined> = this.onDidChangeTreeDataEmitter.event;

  public async getChildren(parent: TAllExplorerNodeTypes | undefined): Promise<TAllExplorerNodeTypes[]> {
    if (parent === undefined) {
      return new ControlPlaneProviderTree().getChildren(ConfigurationProvider.getSavedControlPlanes());
    }

    if (parent.contextValue === undefined) {
      return [];
    }

    switch (parent.contextValue) {
      case Constants.CONTEXT_VALUES.controlPlane:
        const controlPlane = parent as IControlPlaneNode;
        return await new TenantTree().getChildren(controlPlane);
      case Constants.CONTEXT_VALUES.tenant:
        const tenant = parent as ITenantNode;
        return await new ApplicationTree().getChildren(tenant);
      case Constants.CONTEXT_VALUES.folder:
        const folderNode = parent as FolderNode;

        switch (folderNode.folderType) {
          case ExplorerFolderTypes.moduleFolder:
            return await new ModuleTree(folderNode.controlPlane, folderNode.tenantName, folderNode.applicationId).getChildren(folderNode.treeContents as IModule[]);
          case ExplorerFolderTypes.gatewayFolder:
            return await new GatewayTree(folderNode.controlPlane, folderNode.tenantName).getChildren(folderNode.treeContents);
        }
        break;
      case Constants.CONTEXT_VALUES.module:
        const moduleNode = parent as IModuleNode;
        return await new PipelineTree(moduleNode.controlPlane, moduleNode.tenantName, moduleNode.applicationId).getChildren(moduleNode);
    }

    if(parent.contextValue.indexOf(`${Constants.CONTEXT_VALUES.application}.`) > -1){
      const applicationNode = parent as IApplicationNode;
      return [
        new FolderNode("Modules", ExplorerFolderTypes.moduleFolder, applicationNode.applicationDefinition.modules, applicationNode.controlPlane, applicationNode.tenantName, applicationNode.applicationId),
        new FolderNode("Gateways", ExplorerFolderTypes.gatewayFolder, applicationNode.applicationDefinition.gateways, applicationNode.controlPlane, applicationNode.tenantName, applicationNode.applicationId),
      ];
    }

    if(parent.contextValue.indexOf(`${Constants.CONTEXT_VALUES.pipeline}.`) > -1){
      const pipelineNode = parent as IPipelineNode;
      return await new CompositeAgentTree(pipelineNode.controlPlane, pipelineNode.tenantName, pipelineNode.applicationId).getChildren(pipelineNode.executors);
    }

    return []; // the parent type is unknown
  }

  public getTreeItem(element: TAllExplorerNodeTypes): TAllExplorerNodeTypes | Thenable<TAllExplorerNodeTypes> {
    return element;
  }

  public refresh(node?: any): void {
    this.onDidChangeTreeDataEmitter.fire(node);
  }
}


