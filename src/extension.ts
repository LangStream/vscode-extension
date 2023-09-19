// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as Constants from "./common/constants";
import ControlPlaneController from "./controllers/controlPlane";
import Logger from "./common/logger";
import {ControlPlaneNode, IControlPlaneNode} from "./providers/controlPlaneTreeData/nodes/controlPlane";
import ControlPlaneTreeDataProvider from "./providers/controlPlaneTreeData/explorer";
import {ITenantNode} from "./providers/controlPlaneTreeData/nodes/tenant";
import TenantController from "./controllers/tenant";
import {IApplicationNode} from "./providers/controlPlaneTreeData/nodes/application";
import ApplicationController from "./controllers/application";
import DeployApplicationModuleCodeLens from "./providers/deployApplicationModuleCodeLens";
import ExampleApplicationRegistry from "./common/exampleApplications/registry";
import * as path from "path";
import {IGatewayNode} from "./providers/controlPlaneTreeData/nodes/gateway";
import TDeployableApplication from "./types/tDeployableApplication";
import {ICompositeAgentNode} from "./providers/controlPlaneTreeData/nodes/compositeAgent";

export async function activate(context: vscode.ExtensionContext): Promise<void> {
	Logger.info('Welcome to the LangStream extension. There are many wonderful things to see and click.');

	Logger.info('Building providers');
	const controlPlaneTreeProvider = new ControlPlaneTreeDataProvider();
	const deployApplicationModuleCodeLens = new DeployApplicationModuleCodeLens();

	Logger.info('Building example apps registry');
	const exampleApplicationsRegistry = ExampleApplicationRegistry.instance;
	exampleApplicationsRegistry.registerAllExampleApplications(path.join(context.extensionUri.fsPath, "snippets"));

	const documentSelector: vscode.DocumentSelector = [
		{ scheme: '*', language: 'yaml' },
	];

	Logger.info('Building subscriptions');
	const subscriptions = [
		vscode.window.registerTreeDataProvider(Constants.CONTROL_PLANE_TREE, controlPlaneTreeProvider),
		vscode.languages.registerCodeLensProvider(documentSelector, deployApplicationModuleCodeLens),
		vscode.window.registerCustomEditorProvider(Constants.GATEWAY_CUSTOM_EDITOR_VIEW_TYPE, ApplicationController.createGatewayCustomEditorProvider(context)),
		vscode.window.registerCustomEditorProvider(Constants.APP_LOGS_CUSTOM_EDITOR_VIEW_TYPE, ApplicationController.createAppLogsCustomEditorProvider(context)),

		registerCommand(Constants.COMMAND_REMOVE_CONTROL_PLANE, (explorerName: ControlPlaneNode) => ControlPlaneController.removedSavedControlPlane(explorerName, controlPlaneTreeProvider)),
		registerCommand(Constants.COMMAND_REFRESH_EXPLORER, () => controlPlaneTreeProvider.refresh()),
		registerCommand(Constants.COMMAND_ADD_CONTROL_PLANE, () => ControlPlaneController.showAddControlPlaneForm(controlPlaneTreeProvider)),

		registerCommand(Constants.COMMAND_REMOVE_TENANT, (explorerNode: ITenantNode) => TenantController.delete(explorerNode, controlPlaneTreeProvider)),
		registerCommand(Constants.COMMAND_ADD_TENANT, (explorerNode: IControlPlaneNode) => TenantController.add(explorerNode, controlPlaneTreeProvider)),
		registerCommand(Constants.COMMAND_REMOVE_APPLICATION, (explorerNode: IApplicationNode) => ApplicationController.delete(explorerNode, controlPlaneTreeProvider)),
		registerCommand(Constants.COMMAND_INIT_APPLICATION, () => ApplicationController.showNewApplicationOptions(exampleApplicationsRegistry)),
		registerCommand(Constants.COMMAND_DEPLOY_APPLICATION, (deployableApplication: TDeployableApplication) => ApplicationController.deploy(controlPlaneTreeProvider, context, deployableApplication)),
		registerCommand(Constants.COMMAND_UPDATE_APPLICATION, (deployableApplication: TDeployableApplication) => ApplicationController.deploy(controlPlaneTreeProvider, context, deployableApplication)),
		registerCommand(Constants.COMMAND_VIEW_APPLICATION_DETAILS, (explorerNode: IApplicationNode) => ApplicationController.viewDetails(explorerNode)),
		registerCommand(Constants.COMMAND_OPEN_GATEWAY_EDITOR, (explorerNode: IApplicationNode) => ApplicationController.openGatewayCustomEditor(explorerNode)),
		registerCommand(Constants.COMMAND_OPEN_APP_LOGS_FROM_DEPLOY, ApplicationController.openAppLogsCustomEditorFromDeploy),
		registerCommand(Constants.COMMAND_VIEW_OUTPUT_WINDOW, () => { vscode.window.createOutputChannel("AI Streams").show(); }),
		registerCommand(Constants.COMMAND_OPEN_AGENT_LOGS_EDITOR, (explorerNode: ICompositeAgentNode) => ApplicationController.openAgentLogsCustomEditor(explorerNode)),

		//Telemetry.initialize(),
	];

	Logger.info('Registering subscriptions');
	subscriptions.forEach((element) => {
		context.subscriptions.push(element);
	});
}

// This method is called when your extension is deactivated
export function deactivate(): void  {}

function registerCommand(command: string, callback: (...args: any[]) => any): vscode.Disposable {
	return vscode.commands.registerCommand(command, (...args: any[]) => { callback(...args); });
}