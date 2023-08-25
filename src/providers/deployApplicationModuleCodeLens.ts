import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import {applicationModuleManifest} from "../common/codeLensRegex";
import * as Constants from "../common/constants";
import {TSavedControlPlane} from "../types/tSavedControlPlane";
import ConfigurationProvider from "./configuration";
import TenantService from "../services/tenant";
import ApplicationService from "../services/application";
import {ApplicationDescription} from "../services/controlPlaneApi/gen";
import TDeployableApplication from "../types/tDeployableApplication";
import * as yaml from "yaml";
import {IDependency} from "../interfaces/iDependency";

export default class DeployApplicationModuleCodeLens implements vscode.CodeLensProvider {
  private _onDidChangeCodeLenses: vscode.EventEmitter<void> = new vscode.EventEmitter<void>();
  public readonly onDidChangeCodeLenses: vscode.Event<void> = this._onDidChangeCodeLenses.event;

  constructor() {
    vscode.workspace.onDidChangeConfiguration((_) => {
      this._onDidChangeCodeLenses.fire();
    });
  }

  public provideCodeLenses(document: vscode.TextDocument, token: vscode.CancellationToken): vscode.ProviderResult<vscode.CodeLens[]> {
    const documentText = document.getText();
    let regexScore = 0;
    if(token.isCancellationRequested) {
      return [];
    }

    // Test the document for each regex
    for (const regex of applicationModuleManifest) {
      if(!regex.test(documentText)) {
        continue;
      }

      if(token.isCancellationRequested) {
        return [];
      }

      regexScore++;
    }

    if (regexScore !== applicationModuleManifest.length) {
      return [];
    }

    return [
      new vscode.CodeLens(new vscode.Range(0, 0, 0, 0))
    ];
  }

  public resolveCodeLens(codeLens: vscode.CodeLens, token: vscode.CancellationToken): vscode.ProviderResult<vscode.CodeLens> {
    return this.resolve(codeLens).then(() => {
      return codeLens;
    });
  }

  private async resolve(codeLens: vscode.CodeLens): Promise<void>{
    const editor = vscode.window.activeTextEditor;
    const document = editor?.document;
    if (!editor || !document) {
      return;
    }

    // Assume the codelens provider regex has already found name
    const applicationNames = new RegExp(/^.*?(\bname\b:).*?$/im).exec(document.getText());
    if(applicationNames === null || applicationNames.length < 1){
      return; // do not resolve
    }

    const applicationName = applicationNames[0].split(":")[1].trim()
      .replace(/'null'/g, "")
      .replace(/"null"/g, "")
      .replace(/^\bnull\b$/i, "")
      .replace(/"/g, "")
      .replace(/'/g, "")
      .replace(/`/g, "");

    if(applicationName.length < 1){
      return; // do not resolve if name is empty
    }

    // Discover the adjacent files
    const modulePath: string = document.uri.fsPath;
    const adjacentFiles = this.discoverAdjacentFiles(modulePath);

    // Discover the existing application
    const savedControlPlanes = ConfigurationProvider.getSavedControlPlanes();
    if(savedControlPlanes === undefined || savedControlPlanes.length < 1){
      return; // do not resolve if no control planes are saved
    }

    const discoveredApplication = await this.discoverApplication(savedControlPlanes, applicationName);

    const deployableApplication = new class implements TDeployableApplication {
      id = discoveredApplication?.applicationDescription["application-id"] ?? applicationName.toLowerCase().replace(/[^a-zA-Z0-9.-]/g, "-").substring(0, Constants.MAX_APPLICATION_NAME_LENGTH);
      name = applicationName;
      modulePath = modulePath;
      configurationPath = adjacentFiles.configurationPath;
      instancePath = adjacentFiles.instancePath;
      secretsPath = adjacentFiles.secretsPath;
      gatewaysPath = adjacentFiles.gatewaysPath;
      pythonPath = adjacentFiles.pythonDir;
      controlPlane = discoveredApplication?.controlPlane;
      tenantName = discoveredApplication?.tenantName;
      applicationDescription = discoveredApplication?.applicationDescription;
      findDependencies(): IDependency[] {
        if(this.configurationPath === undefined){
          return [];
        }

        const configYaml = yaml.parse(fs.readFileSync(this.configurationPath, 'utf8'));
        return configYaml.dependencies ?? [];
      };
    };

    codeLens.command = this.buildDeployCommand(deployableApplication);
  }

  private buildDeployCommand(deployableApplication: TDeployableApplication): vscode.Command {
    const cmd = (commandName: string, title:string, tooltip?:string, args?:any[]) => {
      return new class implements vscode.Command {
        command = commandName;
        title = title;
        tooltip = tooltip;
        arguments = args;
      };
    };

    if(deployableApplication.instancePath === undefined){
      return cmd("", `Could not find instance.yaml in parent folder`);
    }

    if(deployableApplication.applicationDescription === undefined){
      return cmd(Constants.COMMAND_DEPLOY_APPLICATION,
        "Deploy application",
        "Deploy the application to control plane",
        [deployableApplication]);
    }

    return cmd(Constants.COMMAND_UPDATE_APPLICATION,
      "Update application",
      "Update the existing application on control plane",
      [deployableApplication]);
  }

  private discoverAdjacentFiles(modulePath: string): {configurationPath?: string, instancePath?: string, secretsPath?: string, gatewaysPath?: string, pythonDir?: string} {
    let configurationPath: string | undefined = undefined;
    let instancePath: string | undefined = undefined;
    let secretsPath: string | undefined = undefined;
    let gatewaysPath: string | undefined = undefined;
    let pythonDir: string | undefined = undefined;

    // Discover adjacent application files
    const thisDir = path.parse(modulePath).dir;
    fs.readdirSync(thisDir, { withFileTypes: true }).forEach((value:fs.Dirent) => {
      if(value.isDirectory() && value.name.toLowerCase() === 'python'){
        pythonDir = path.join(thisDir, value.name);
        return;
      }

      switch (value.name.toLowerCase()){
        case 'configuration.yaml':
          configurationPath = path.join(thisDir, value.name);
          break;
        case 'gateways.yaml':
          gatewaysPath = path.join(thisDir, value.name);
          break;
      }
    });

    // Look in parent directory for instance.yaml and secrets.yaml and python files
    const parentDir = path.parse(thisDir).dir;
    fs.readdirSync(parentDir, { withFileTypes: true }).forEach((value:fs.Dirent) => {
      if(value.isDirectory()){
        return;
      }

      switch (value.name.toLowerCase()){
        case 'instance.yaml':
          instancePath = path.join(parentDir, value.name);
          break;
        case 'secrets.yaml':
          secretsPath = path.join(parentDir, value.name);
          break;
      }
    });

    return {
      configurationPath,
      instancePath,
      secretsPath,
      gatewaysPath,
      pythonDir
    };
  }

  private async discoverApplication(savedControlPlanes: TSavedControlPlane[], applicationName: string): Promise<{ controlPlane: TSavedControlPlane, tenantName: string, applicationDescription: ApplicationDescription } | undefined> {
    for (const savedControlPlane of savedControlPlanes) {
      const tenantService = new TenantService(savedControlPlane);
      const tenants = await tenantService.listNames();

      for (const tenant of tenants) {
        const applicationService = new ApplicationService(savedControlPlane);
        const applicationIds = await applicationService.listIds(tenant);

        for (const applicationId of applicationIds) {
          const applicationDesc = await applicationService.get(tenant, applicationId);
          if (applicationDesc === undefined || applicationDesc.application === undefined || applicationDesc.application.modules === undefined) {
            continue;
          }

          for (const module of applicationDesc.application.modules) {
            if(module === undefined || module.pipelines === undefined){
              continue;
            }

            for(const pipeline of module.pipelines){
              if(pipeline?.name?.toLowerCase() === applicationName.toLowerCase()){
                return {
                  controlPlane: savedControlPlane,
                  tenantName: tenant,
                  applicationDescription: applicationDesc
                };
              }
            }
          }
        }
      }
    }

    return undefined;
  }
}