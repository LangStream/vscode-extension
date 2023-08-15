import * as vscode from "vscode";
import {IApplicationNode} from "../providers/controlPlaneTreeData/nodes/application";
import ControlPlaneTreeDataProvider from "../providers/controlPlaneTreeData/explorer";
import Logger from "../common/logger";
import {StoredApplication} from "../services/controlPlaneApi/gen";
import ApplicationService from "../services/application";
import ProgressRunner from "../common/progressRunner";
import WatchApplicationDeletingTask from "../services/watchApplicationDeletingTask";
import * as fs from "fs";
import ConfigurationProvider from "../providers/configuration";
import TenantService from "../services/tenant";
import WatchApplicationDeployTask from "../services/watchApplicationDeployTask";
import * as path from "path";
import StreamingApplication from "../common/streamingApplication";
import DocumentHelper from "../common/documentHelper";
import {IWorkerNode} from "../providers/controlPlaneTreeData/nodes/worker";
import CassandraSinkExampleApplication from "../common/exampleApplications/cassandraSink";
import HuggingfaceCompletionExampleApplication from "../common/exampleApplications/huggingfaceCompletion";
import QueryCassandraExampleApplication from "../common/exampleApplications/queryCassandra";
import S3SourceExampleApplication from "../common/exampleApplications/s3Source";
import ComputeOpenAIEmbeddingsExampleApplication from "../common/exampleApplications/computeOpenAIEmbeddings";
import ComputeVertexEmbeddingsExampleApplication from "../common/exampleApplications/computeVertexAIEmbeddings";
import TDeployableApplication from "../types/tDeployableApplication";
import * as Constants from "../common/constants";
import GatewayCustomEditorProvider from "../providers/gatewayCustomEditor/gatewayCustomEditorProvider";
import AppLogsCustomEditorProvider from "../providers/appLogsCustomEditor/appLogsCustomEditorProvider";

export default class ApplicationController {
  public static async delete(applicationNode: IApplicationNode, controlPlaneTreeProvider: ControlPlaneTreeDataProvider): Promise<void> {
    const applicationService = new ApplicationService(applicationNode.controlPlane);
    const applicationName = <string>applicationNode.storedApplication.applicationId;

    const confirmDelete = await vscode.window.showWarningMessage(`Are you sure you want to delete application '${applicationNode.label}'?`, { modal: true }, 'Yes', 'No');
    if (confirmDelete !== 'Yes') {
      return;
    }

    const task = new WatchApplicationDeletingTask(applicationNode.tenantName, applicationName, applicationService, controlPlaneTreeProvider);

    Logger.info(`Deleting application '${applicationName}'`);

    applicationService.delete(applicationNode.tenantName, applicationName).then(() => {
      new ProgressRunner<StoredApplication>("Delete application").run(task).finally(() => {
        controlPlaneTreeProvider.refresh();
      });
    }).catch((e: any) => {
      Logger.error('Deploy application', e);
      vscode.window.showErrorMessage(e.data?.detail ?? "An error occurred deleting, refer to the output view for more details");
    });
  }

  public static async showInitOptions(context:vscode.ExtensionContext): Promise<void>{
    const exampleQuickPickOpts: vscode.QuickPickOptions = {
      canPickMany: false,
      ignoreFocusOut: true,
      placeHolder: "Select the type of example application"
    };

    const applicationPathOpts: vscode.OpenDialogOptions = {
      canSelectFiles: false,
      canSelectFolders: true,
      canSelectMany: false,
      openLabel: `Select folder`
    };

    const exampleApplications = [
      "Cassandra sink",
      "Compute embeddings with OpenAI",
      "Compute embeddings with Vertex AI",
      "Hugging-face prompt completion",
      "OpenAI prompt completion",
      "Query cassandra",
      "AWS S3 source"
    ];

    const exampleApplicationName = await vscode.window.showQuickPick(exampleApplications, exampleQuickPickOpts);
    if(exampleApplicationName === undefined){
      return;
    }

    let exampleApplication: StreamingApplication | undefined = undefined;
    const extensionUriPath = context.extensionUri.fsPath;

    switch (exampleApplicationName){
      case "Cassandra sink":
        exampleApplication = new CassandraSinkExampleApplication(extensionUriPath);
        break;
      case "Compute embeddings with OpenAI":
        exampleApplication = new ComputeOpenAIEmbeddingsExampleApplication(extensionUriPath);
        break;
      case "Compute embeddings with Vertex AI":
        exampleApplication = new ComputeVertexEmbeddingsExampleApplication(extensionUriPath);
        break;
      case "Hugging-face prompt completion":
        exampleApplication = new HuggingfaceCompletionExampleApplication(extensionUriPath);
        break;
      case "OpenAI prompt completion":
        exampleApplication = new HuggingfaceCompletionExampleApplication(extensionUriPath);
        break;
      case "Query cassandra":
        exampleApplication = new QueryCassandraExampleApplication(extensionUriPath);
        break;
      case "AWS S3 source":
        exampleApplication = new S3SourceExampleApplication(extensionUriPath);
        break;
    }

    if(exampleApplication === undefined){
      return;
    }

    Logger.info(`Creating application '${exampleApplicationName}'`);

    const uris = await vscode.window.showOpenDialog(applicationPathOpts);

    if (uris === undefined) {
      return;
    }

    const uri = uris[0];

    let applicationFilePaths;
    try{
      applicationFilePaths = exampleApplication.writeAsFiles(uri.fsPath);
    }catch (e:any){
      Logger.error('Create application files', e);
      vscode.window.showErrorMessage(`Could not init application, ${e.message}`);
      return;
    }

    const openFilePromises:Thenable<void>[] = [];

    applicationFilePaths.forEach(([fileName, fullPath]) => {
      vscode.workspace.openTextDocument(fullPath.toString()).then((doc) => {
        if(fileName.indexOf("pipeline.yaml") > -1){
          vscode.window.showTextDocument(doc, vscode.ViewColumn.Active, false);
        }
      });
    });

    await Promise.all(openFilePromises).then(() => {
      vscode.workspace.updateWorkspaceFolders(vscode.workspace.workspaceFolders ? vscode.workspace.workspaceFolders.length : 0,
        undefined,
        {uri: uri, name: exampleApplicationName});
    },(e:any) => {
      Logger.error('Create application files', e);
      vscode.window.showErrorMessage(`Could not set workspace, ${e.message}`);
    });
  }

  public static async deploy(controlPlaneTreeProvider: ControlPlaneTreeDataProvider,
                             context:vscode.ExtensionContext,
                             deployableApplication: TDeployableApplication) {

    // Prompt to choose control plane
    if (deployableApplication.controlPlane === undefined) {
      const controlPlaneTenants: string[] = [];

      const savedControlPlanes = ConfigurationProvider.getSavedControlPlanes();
      for (const savedControlPlane of savedControlPlanes) {
        const tenantService = new TenantService(savedControlPlane);
        const tenants = await tenantService.listNames();

        for (const tenant of tenants) {
          controlPlaneTenants.push(`${savedControlPlane.name}/${tenant}`);
        }
      }

      const options: vscode.QuickPickOptions = {
        canPickMany: false,
        ignoreFocusOut: true,
        placeHolder: "Select the control plane/tenant to deploy to"
      };

      const selectedControlPlaneTenant = await vscode.window.showQuickPick(controlPlaneTenants, options);
      if (selectedControlPlaneTenant === undefined) {
        return;
      }

      const [controlPlaneName, tenantNameSelected] = selectedControlPlaneTenant.split("/");
      deployableApplication.controlPlane = savedControlPlanes.find((savedControlPlane) => savedControlPlane.name === controlPlaneName);
      deployableApplication.tenantName = tenantNameSelected;
    }

    if(deployableApplication.controlPlane === undefined || deployableApplication.tenantName === undefined){
      vscode.window.showErrorMessage(`Control plane and tenant name are required`);
      return;
    }

    const artifactName = `${deployableApplication.name.replace(/[^a-zA-Z0-9_-]/g, "-").toLowerCase()}.zip`;
    const zipFileUri = vscode.Uri.file(path.join(context.globalStorageUri.fsPath, artifactName)); // Use vscode global storage path

    if(!fs.existsSync(context.globalStorageUri.fsPath)) {
      fs.mkdirSync(context.globalStorageUri.fsPath);
    }

    const applicationService = new ApplicationService(deployableApplication.controlPlane);
    let dependenciesPaths: [string, fs.PathLike][];

    // Download dependencies
    Logger.debug("Checking dependencies");
    try {
      const dependencies = deployableApplication.findDependencies();
      dependenciesPaths = await applicationService.downloadDependencies(zipFileUri.fsPath, dependencies);
    } catch (e: any) {
      Logger.error('Dependencies', e);
      this.cleanUpWorkspace(zipFileUri.fsPath);
      vscode.window.showErrorMessage(`Could not download dependencies, ${e.message}`);
      return;
    }

    // Create the application artifact
    Logger.debug("Creating application artifact");
    try {
      await applicationService.zipApplication(zipFileUri.fsPath,
        deployableApplication.modulePath,
        <string>deployableApplication.instancePath,
        deployableApplication.configurationPath,
        deployableApplication.secretsPath,
        deployableApplication.gatewaysPath,
        dependenciesPaths);
    } catch (e: any) {
      Logger.error('Zip', e);
      this.cleanUpWorkspace(zipFileUri.fsPath);
      vscode.window.showErrorMessage(`Could not create application artifact, ${e.message}`);
      return;
    }

    const watchDeployTask = new WatchApplicationDeployTask(deployableApplication.controlPlane.name, deployableApplication.tenantName,
                                                          deployableApplication.storedApplication?.applicationId ?? deployableApplication.id,
                                                          applicationService);

    // Call deploy|update and wait for it to finish or error (it should return quickly). Then watch app status.

    if(deployableApplication.storedApplication === undefined){
      applicationService.deploy(deployableApplication.tenantName, deployableApplication.id, zipFileUri.fsPath).then(() => {
        new ProgressRunner<StoredApplication>("Deploy").run(watchDeployTask).finally(() => {
          controlPlaneTreeProvider.refresh();
          this.cleanUpWorkspace(zipFileUri.fsPath);
        });
      }).catch((e: any) => {
        Logger.error('Deploy application', e);
        vscode.window.showErrorMessage(e.data?.detail ?? "An error occurred deploying, refer to the output view for more details");
        this.cleanUpWorkspace(zipFileUri.fsPath);
      });
      return;
    }

    applicationService.update(deployableApplication.tenantName, <string>deployableApplication.storedApplication.applicationId, zipFileUri.fsPath).then(() => {
      new ProgressRunner<StoredApplication>("Update application").run(watchDeployTask).finally(() => {
        controlPlaneTreeProvider.refresh();
        this.cleanUpWorkspace(zipFileUri.fsPath);
      });
    }).catch((e: any) => {
      Logger.error('Update application', e);
      vscode.window.showErrorMessage(e.data?.detail ?? "An error occurred updating, refer to the output view for more details");
      this.cleanUpWorkspace(zipFileUri.fsPath);
    });
  }

  private static cleanUpWorkspace(zipPath:string): void {
    try{ fs.rmSync(zipPath, { force: true, maxRetries: 5, recursive: true, retryDelay: 250 }); }catch{}
  }

  public static viewDetails(explorerNode: IApplicationNode) {
    Logger.info(`Viewing details for ${explorerNode.storedApplication.applicationId}`);
    const applicationService = new ApplicationService(explorerNode.controlPlane);

    return applicationService.get(explorerNode.tenantName, <string>explorerNode.storedApplication.applicationId).then(storedApplication => {
      DocumentHelper.openDocument(storedApplication, "yaml").then(doc => {
        DocumentHelper.showDocument(doc, true);
      });
    });
  }

  public static async viewWorkerLogs(explorerNode: IWorkerNode): Promise<void>  {
    Logger.info(`Viewing worker logs for ${explorerNode.label}`);
    const applicationService = new ApplicationService(explorerNode.controlPlane);

    await applicationService.getLogs(explorerNode.tenantName, explorerNode.applicationId, [<string>explorerNode.label]).then(logs => {
      DocumentHelper.openDocument(logs, "yaml").then(doc => {
        DocumentHelper.showDocument(doc, true);
      });
    });
  }

  public static async viewRuntimeInfo(explorerNode: IApplicationNode): Promise<void>  {
    Logger.info(`Viewing runtime info for ${explorerNode.storedApplication.applicationId}`);
    const applicationService = new ApplicationService(explorerNode.controlPlane);

    return applicationService.getRuntimeInfo(explorerNode.tenantName, <string>explorerNode.storedApplication.applicationId).then(runtimeInfo => {
      DocumentHelper.openDocument(runtimeInfo, "yaml").then(doc => {
        DocumentHelper.showDocument(doc, true);
      });
    });
  }

  public static createGatewayCustomEditorProvider(context: vscode.ExtensionContext): GatewayCustomEditorProvider {
    return new GatewayCustomEditorProvider(context);
  }

  public static async openGatewayCustomEditor(explorerNode: IApplicationNode): Promise<void>  {
    const virtualFilePath = path.join(explorerNode.controlPlane.name,
      explorerNode.tenantName,
      `${explorerNode.storedApplication.applicationId}.gateway.${Constants.LANGUAGE_NAME}`
    );

    const uri = vscode.Uri.from({
      scheme: 'untitled',
      path: virtualFilePath.toLowerCase()
    });

    vscode.commands.executeCommand('vscode.openWith', uri, Constants.GATEWAY_CUSTOM_EDITOR_VIEW_TYPE);
  }

  public static createAppLogsCustomEditorProvider(context: vscode.ExtensionContext) {
    return new AppLogsCustomEditorProvider(context);
  }

  public static async openAppLogsCustomEditor(explorerNode: IApplicationNode): Promise<void>  {
    const virtualFilePath = path.join(explorerNode.controlPlane.name,
      explorerNode.tenantName,
      `${explorerNode.storedApplication.applicationId}.logs.${Constants.LANGUAGE_NAME}`
    );

    const uri = vscode.Uri.from({
      scheme: 'untitled',
      path: virtualFilePath.toLowerCase()
    });

    vscode.commands.executeCommand('vscode.openWith', uri, Constants.APP_LOGS_CUSTOM_EDITOR_VIEW_TYPE);
  }

  public static async openAppLogsCustomEditorFromDeploy(controlPlaneName:string, tenantName:string, applicationId:string): Promise<void> {
    const virtualFilePath = path.join(controlPlaneName,
      tenantName,
      `${applicationId}.logs.${Constants.LANGUAGE_NAME}`
    );

    const uri = vscode.Uri.from({
      scheme: 'untitled',
      path: virtualFilePath.toLowerCase()
    });

    vscode.commands.executeCommand('vscode.openWith', uri, Constants.APP_LOGS_CUSTOM_EDITOR_VIEW_TYPE);
  }
}
