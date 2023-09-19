import * as vscode from "vscode";
import {IApplicationNode} from "../providers/controlPlaneTreeData/nodes/application";
import ControlPlaneTreeDataProvider from "../providers/controlPlaneTreeData/explorer";
import Logger from "../common/logger";
import {ApplicationDescription} from "../services/controlPlaneApi/gen";
import ApplicationService from "../services/application";
import ProgressRunner from "../common/progressRunner";
import WatchApplicationDeletingTask from "../services/watchApplicationDeletingTask";
import * as fs from "fs";
import ConfigurationProvider from "../providers/configuration";
import TenantService from "../services/tenant";
import WatchApplicationDeployTask from "../services/watchApplicationDeployTask";
import * as path from "path";
import DocumentHelper from "../common/documentHelper";
import * as Constants from "../common/constants";
import GatewayCustomEditorProvider from "../providers/gatewayCustomEditor/gatewayCustomEditorProvider";
import AppLogsCustomEditorProvider from "../providers/appLogsCustomEditor/appLogsCustomEditorProvider";
import ExampleApplicationRegistry from "../common/exampleApplications/registry";
import {randomUUID} from "node:crypto";
import TDeployableApplication from "../types/tDeployableApplication";
import {TSavedControlPlane} from "../types/tSavedControlPlane";
import {downloadDependencies} from "../utils/downloadDependencies";
import {zipFiles} from "../utils/zip";
import {gatherDirFiles} from "../utils/gatherDirFiles";
import {TArtifactItem} from "../types/tArtifactItem";
import {writeApplicationAsFiles} from "../utils/writeApplicationAsFiles";
import WatchApplicationUpdateTask from "../services/watchApplicationUpdateTask";
import randomNumberString from "../utils/randomNumberString";
import WatchArtifactBuildTask from "../services/watchArtifactBuildTask";
import {CancellationTokenSource} from "vscode";
import {ICompositeAgentNode} from "../providers/controlPlaneTreeData/nodes/compositeAgent";

export default class ApplicationController {
  public static async delete(applicationNode: IApplicationNode, controlPlaneTreeProvider: ControlPlaneTreeDataProvider): Promise<void> {
    const applicationService = new ApplicationService(applicationNode.controlPlane);
    const applicationId = applicationNode.applicationId;

    const confirmDelete = await vscode.window.showWarningMessage(`Are you sure you want to delete application '${applicationNode.label}'?`, { modal: true }, 'Yes', 'No');
    if (confirmDelete !== 'Yes') {
      return;
    }


    const task = new WatchApplicationDeletingTask(applicationNode.tenantName, applicationId, applicationService, () => {
      return new Promise<void>(() => { }); });

    Logger.info(`Deleting application '${applicationId}'`);

    const promises:Promise<void>[] = [];
    const abortController = new AbortController();

    promises.push(applicationService.delete(applicationNode.tenantName, applicationId));
    promises.push(new ProgressRunner<ApplicationDescription>("Delete application").run(task, abortController.signal));

    Promise.all(promises).then(() => {
      //no op
    }).catch((e: any) => {
      Logger.error('Delete application', e);
      vscode.window.showErrorMessage(e.data?.detail ?? "An error occurred deleting, refer to the output view for more details");
    }).finally(() => {
      abortController.abort();
      controlPlaneTreeProvider.refresh();
    });
  }

  public static async showNewApplicationOptions(exampleApplicationsRegistry: ExampleApplicationRegistry): Promise<void>{
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

    const exampleApplications = exampleApplicationsRegistry.exampleApplications.map((exampleApplication) => exampleApplication.exampleApplicationName);

    const exampleApplicationName = await vscode.window.showQuickPick(exampleApplications, exampleQuickPickOpts);

    if(exampleApplicationName === undefined){
      return;
    }

    const exampleApplication = exampleApplicationsRegistry.exampleApplications.find((exampleApplication) => exampleApplication.exampleApplicationName === exampleApplicationName);

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
      applicationFilePaths = writeApplicationAsFiles(uri.fsPath, exampleApplication);
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

  private static async promptForControlPlaneTenant(): Promise<[TSavedControlPlane, string] | undefined> {
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
      return undefined;
    }

    const [controlPlaneName, tenantNameSelected] = selectedControlPlaneTenant.split("/");
    const controlPlane = savedControlPlanes.find((savedControlPlane) => savedControlPlane.name === controlPlaneName);
    return [controlPlane!, tenantNameSelected];
  }

  private static async gatherFilesAndBuildArtifact(deployableApplication: TDeployableApplication, zipFileUri: fs.PathLike, downloadPath: fs.PathLike): Promise<void> {
    return new Promise(async (resolve, reject) => {
      const artifactItems: TArtifactItem[] = [];

      // Look for python files
      if(deployableApplication.pythonPath !== undefined){
        const pythonFiles = gatherDirFiles("python", deployableApplication.pythonPath.toString());
        artifactItems.push(...pythonFiles);
      }

      // Download dependencies
      Logger.debug("Checking dependencies");
      try {
        const deps = deployableApplication.findDependencies();
        const depFiles = await downloadDependencies(downloadPath, deps);
        artifactItems.push(...depFiles);
      } catch (e: any) {
        Logger.error('Dependencies', e);
        reject(new Error(`Could not download dependencies, ${e.message}`));
        return;
      }

      if(deployableApplication.modulePath !== undefined){ artifactItems.push(["pipeline.yaml", deployableApplication.modulePath]); }
      if(deployableApplication.configurationPath !== undefined){ artifactItems.push(["configuration.yaml", deployableApplication.configurationPath]); }
      if(deployableApplication.gatewaysPath !== undefined){ artifactItems.push(["gateways.yaml", deployableApplication.gatewaysPath]); }

      // Create the application artifact
      Logger.debug("Creating application artifact");
      try {
        await zipFiles(zipFileUri, artifactItems);
      } catch (e: any) {
        Logger.error('Zip', e);
        reject(new Error(`Could not create application artifact, ${e.message}`));
        return;
      }

      resolve();
    });
  }

  public static async deploy(controlPlaneTreeProvider: ControlPlaneTreeDataProvider,
                             context:vscode.ExtensionContext,
                             deployableApplication: TDeployableApplication){

    // Prompt to choose control plane
    if (deployableApplication.controlPlane === undefined) {
      const selectedValues = await this.promptForControlPlaneTenant();
      if(selectedValues === undefined){
        return;
      }

      deployableApplication.controlPlane = selectedValues[0];
      deployableApplication.tenantName = selectedValues[1];
    }

    if(deployableApplication.controlPlane === undefined || deployableApplication.tenantName === undefined){
      vscode.window.showErrorMessage(`Control plane and tenant name are required`);
      return;
    }

    // Ensure artifact is ready
    const artifactName = `${randomUUID().toString()}.zip`;
    const zipFileUri = vscode.Uri.file(path.join(context.globalStorageUri.fsPath, artifactName)); // Use vscode global storage path

    if(!fs.existsSync(context.globalStorageUri.fsPath)) {
      fs.mkdirSync(context.globalStorageUri.fsPath);
    }

    // Build the artifact
    const promises:Promise<void>[] = [];
    const buildArtifactTask = new WatchArtifactBuildTask(zipFileUri.fsPath);
    const abortController = new AbortController();

    promises.push(this.gatherFilesAndBuildArtifact(deployableApplication, zipFileUri.fsPath, context.globalStorageUri.fsPath));
    promises.push(new ProgressRunner<Uint8Array>("Build application artifact").run(buildArtifactTask, abortController.signal));

    await Promise.race(promises).then((o) => {
      abortController.abort();
    }).catch((e: any) => {
      Logger.error('Build artifact', e);
      this.cleanUpWorkspace(zipFileUri.fsPath);
      vscode.window.showErrorMessage(e.message);
    });

    promises.splice(0, promises.length); // Clear the promises array
    const applicationService = new ApplicationService(deployableApplication.controlPlane);

    // Deploy or update
    if(deployableApplication.applicationDescription === undefined){
      const watchDeployTask = new WatchApplicationDeployTask(deployableApplication.controlPlane.name,
        deployableApplication.tenantName,
        deployableApplication.id,
        applicationService,
        () => {
          return new Promise<void>(() => {
            //controlPlaneTreeProvider.refresh();
          });
        });

      promises.push(applicationService.deploy(deployableApplication.tenantName,
                                              deployableApplication.id,
                                              zipFileUri.fsPath,
                                              deployableApplication.instancePath!,
                                              deployableApplication.secretsPath));
      promises.push(new ProgressRunner<ApplicationDescription>("Deploy").run(watchDeployTask, abortController.signal));
    }else{
      // const applicationTreeNode = controlPlaneTreeProvider.getTreeItemByLabelAddress(
      //   `${deployableApplication.controlPlane.name}/${deployableApplication.tenantName}/${<string>deployableApplication.applicationDescription["application-id"]}`
      // );

      const watchUpdateTask = new WatchApplicationUpdateTask(deployableApplication.controlPlane.name, deployableApplication.tenantName,
        <string>deployableApplication.applicationDescription["application-id"],
        applicationService,
        () => {
          return new Promise<void>(() => {
            //controlPlaneTreeProvider.refresh();
          });
        });

      promises.push(applicationService.update(deployableApplication.tenantName,
                                              <string>deployableApplication.applicationDescription["application-id"],
                                              zipFileUri.fsPath,
                                              deployableApplication.instancePath!,
                                              deployableApplication.secretsPath));
      promises.push(new ProgressRunner<ApplicationDescription>("Update").run(watchUpdateTask, abortController.signal));
    }

    // Run all promises
    Promise.all(promises).then((o) => {
      //no op
    }).catch((e: any) => {
      vscode.window.showErrorMessage(e.data?.detail ?? "An error occurred deploying, refer to the output view for more details");
      this.cleanUpWorkspace(zipFileUri.fsPath);
    }).finally(() => {
      controlPlaneTreeProvider.refresh();
      this.cleanUpWorkspace(zipFileUri.fsPath);
    });
  }

  private static cleanUpWorkspace(zipPath: fs.PathLike): void {
    try{ fs.rmSync(zipPath, { force: true, maxRetries: 5, recursive: true, retryDelay: 250 }); }catch{}
  }

  public static viewDetails(applicationNode: IApplicationNode) {
    Logger.info(`Viewing details for ${applicationNode.applicationId}`);
    const applicationService = new ApplicationService(applicationNode.controlPlane);

    return applicationService.get(applicationNode.tenantName, applicationNode.applicationId).then(storedApplication => {
      DocumentHelper.openDocument(storedApplication, "yaml").then(doc => {
        DocumentHelper.showDocument(doc, true);
      });
    });
  }

  public static createGatewayCustomEditorProvider(context: vscode.ExtensionContext): GatewayCustomEditorProvider {
    return new GatewayCustomEditorProvider(context);
  }

  public static async openGatewayCustomEditor(applicationNode: IApplicationNode): Promise<void>  {
    const virtualFilePath = path.join(applicationNode.controlPlane.name,
      applicationNode.tenantName,
      randomNumberString(5),
      `${applicationNode.applicationId}.gateway.${Constants.LANGUAGE_NAME}`,
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

  public static async openAgentLogsCustomEditor(compositeAgentNode: ICompositeAgentNode): Promise<void>  {
    const virtualFilePath = path.join(compositeAgentNode.controlPlane.name,
      compositeAgentNode.tenantName,
                                      `${compositeAgentNode.applicationId}.logs.${Constants.LANGUAGE_NAME}`
    );

    let uri = vscode.Uri.from({
      scheme: 'untitled',
      path: virtualFilePath.toLowerCase()
    });

    const workerIds = compositeAgentNode.executorDescription.replicas?.map((replica) => replica.id).join(",");

    uri = uri.with({query: `workerIds=${workerIds}`});

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
