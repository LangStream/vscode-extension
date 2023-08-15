import * as vscode from "vscode";
import {TAllExplorerNodeTypes} from "../../types/tAllExplorerNodeTypes";
import * as Constants from "../../common/constants";
import ConfigurationProvider from "../configuration";
import {ControlPlaneProviderTree, IControlPlaneNode} from "./nodes/controlPlane";
import TenantTree, {ITenantNode} from "./nodes/tenant";
import ApplicationTree, {IApplicationNode} from "./nodes/application";
import AgentTree, {IAgentNode} from "./nodes/agent";
import WorkerTree from "./nodes/worker";

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
    }

    if(parent.contextValue.indexOf(`${Constants.CONTEXT_VALUES.application}.`) > -1){
      const application = parent as IApplicationNode;
      return await new AgentTree().getChildren(application);
    }

    if(parent.contextValue.indexOf(`${Constants.CONTEXT_VALUES.agent}.`) > -1){
      const agent = parent as IAgentNode;
      return await new WorkerTree(agent.controlPlane, agent.tenantName, agent.applicationId).getChildren(agent);
    }

    return []; // the parent type is unknown
  }

  public getTreeItem(element: TAllExplorerNodeTypes): TAllExplorerNodeTypes | Thenable<TAllExplorerNodeTypes> {
    return element;
  }

  public refresh(node?: any): void {
    this.onDidChangeTreeDataEmitter.fire(node);
  }

  private onElementCollapsed(e: vscode.TreeViewExpansionEvent<TAllExplorerNodeTypes>) {
    this.collapse(e.element);
  }

  private onElementExpanded(e: vscode.TreeViewExpansionEvent<TAllExplorerNodeTypes>) {
    this.expand(e.element);
  }

  private expand(node: TAllExplorerNodeTypes) {
    //no op
  }

  private collapse(node: TAllExplorerNodeTypes) {
    //no op
  }
}