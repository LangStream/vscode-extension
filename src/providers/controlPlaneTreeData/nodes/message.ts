import {Command} from "vscode";
import * as vscode from "vscode";
import {CONTEXT_VALUES, ExplorerMessageTypes} from "../../../common/constants";

export interface IMessageNode extends vscode.TreeItem{
  readonly messageText: string;
  readonly messageType: ExplorerMessageTypes;
  readonly command: Command | undefined;
}

export default class MessageNode extends vscode.TreeItem implements IMessageNode {
  constructor(public readonly messageType: ExplorerMessageTypes, readonly messageText: string = '', readonly command: Command | undefined = undefined) {
    super("", vscode.TreeItemCollapsibleState.None);
    this.contextValue = CONTEXT_VALUES.message;
    this.command = command;

    switch (messageType) {
      case ExplorerMessageTypes.noTenants:
        this.label = "(no tenants)";
        break;
      case ExplorerMessageTypes.noApplications:
        this.label = "(no applications)";
        break;
      case ExplorerMessageTypes.noCompositeAgents:
        this.label = "(no agents)";
        break;
      case ExplorerMessageTypes.noModules:
        this.label = "(no modules)";
        break;
      case ExplorerMessageTypes.noGateways:
        this.label = "(no gateways)";
        break;
      case ExplorerMessageTypes.noPipelines:
        this.label = "(no pipelines)";
        break;
      default:
        this.label = "Unknown";
    }
  }
}