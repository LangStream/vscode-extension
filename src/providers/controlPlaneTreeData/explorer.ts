import * as vscode from "vscode";
import {TAllExplorerNodeTypes} from "../../types/tAllExplorerNodeTypes";
import * as Constants from "../../common/constants";
import ConfigurationProvider from "../configuration";
import {ControlPlaneProviderTree, IControlPlaneNode} from "./nodes/controlPlane";
import TenantTree, {ITenantNode} from "./nodes/tenant";
import ApplicationTree, {IApplicationNode} from "./nodes/application";
import FolderNode from "./nodes/folder";
import {ExplorerFolderTypes} from "../../common/constants";
import * as lsModels from "../../services/controlPlaneApi/gen/models";
import ModuleTree, {IModuleNode} from "./nodes/module";
import GatewayTree from "./nodes/gateway";
import PipelineTree, {IPipelineNode} from "./nodes/pipeline";
import AgentTree, {IAgentNode} from "./nodes/agent";
import Logger from "../../common/logger";

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
            return await new ModuleTree().getChildren(folderNode.treeContents as lsModels.ModuleDefinition[]);
          case ExplorerFolderTypes.gatewayFolder:
            return await new GatewayTree(folderNode.controlPlane, folderNode.tenantName).getChildren(folderNode.treeContents as lsModels.Gateways);
        }
        break;
      case Constants.CONTEXT_VALUES.module:
        const moduleNode = parent as IModuleNode;
        return await new PipelineTree().getChildren(moduleNode);
    }

    if(parent.contextValue.indexOf(`${Constants.CONTEXT_VALUES.application}.`) > -1){
      const applicationNode = parent as IApplicationNode;
      return [
        new FolderNode("Modules", ExplorerFolderTypes.moduleFolder, applicationNode.applicationDefinition.modules, applicationNode.controlPlane, applicationNode.tenantName),
        new FolderNode("Gateways", ExplorerFolderTypes.gatewayFolder, applicationNode.applicationDefinition.gateways, applicationNode.controlPlane, applicationNode.tenantName ),
      ];
    }

    if(parent.contextValue.indexOf(`${Constants.CONTEXT_VALUES.pipeline}.`) > -1){
      const pipelineNode = parent as IPipelineNode;
      return await new AgentTree().getChildren(pipelineNode);
    }

    return []; // the parent type is unknown
  }

  public getTreeItem(element: TAllExplorerNodeTypes): TAllExplorerNodeTypes | Thenable<TAllExplorerNodeTypes> {
    return element;
  }

  public refresh(node?: any): void {
    this.onDidChangeTreeDataEmitter.fire(node);
  }

  public async getTreeItemByLabelAddress(labelAddress: string): Promise<TAllExplorerNodeTypes | undefined> {
    const labelAddresses:string[] = labelAddress.split("/");
    const controlPlaneName = labelAddresses[0];
    let tenantTreeNode: ITenantNode | undefined = undefined;
    let applicationTreeNode: IApplicationNode | undefined = undefined;
    let moduleTreeNode: IModuleNode | undefined = undefined;
    let pipelineTreeNode: IPipelineNode | undefined = undefined;
    let agentTreeNode: IAgentNode | undefined = undefined;

    const controlPlaneTreeNodes = await this.getChildren(undefined);
    const controlPlaneTreeNode = controlPlaneTreeNodes.find((controlPlaneTreeNode) => { return controlPlaneTreeNode.label === controlPlaneName; }) as IControlPlaneNode;

    if(labelAddresses.length === 1){
      return controlPlaneTreeNode;
    }

    let idx = 0;
    let currentNode: TAllExplorerNodeTypes | undefined = undefined;
    for(const labelAddress of labelAddresses){
      switch (idx) {
        case 1:
          currentNode = tenantTreeNode = await this.findNode<ITenantNode>(controlPlaneTreeNode, labelAddress);
          break;
        case 2:
          currentNode = applicationTreeNode = await this.findNode<IApplicationNode>(tenantTreeNode!, labelAddress);
          break;
        case 3:
          currentNode = moduleTreeNode = await this.findNode<IModuleNode>(applicationTreeNode!, labelAddress);
          break;
        case 4:
          currentNode = pipelineTreeNode = await this.findNode<IPipelineNode>(moduleTreeNode!, labelAddress);
          break;
        case 5:
          currentNode = agentTreeNode = await this.findNode<IAgentNode>(pipelineTreeNode!, labelAddress);
      }

      if(labelAddresses.length === (idx+1)){
        return currentNode;
      }

      idx++;
    }

    return undefined;
  }

  private async findNode<T>(node: TAllExplorerNodeTypes, label: string): Promise<T | undefined> {
    const children = await this.getChildren(node);
    return children.find((child) => child.label?.toString().toLowerCase() === label.toLowerCase()) as T | undefined;
  }
}


