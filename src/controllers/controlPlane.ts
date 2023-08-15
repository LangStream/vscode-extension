import * as vscode from "vscode";
import {URL} from "url";
import ConfigurationProvider from "../providers/configuration";
import {TSavedControlPlane} from "../types/tSavedControlPlane";
import {ControlPlaneNode} from "../providers/controlPlaneTreeData/nodes/controlPlane";
import ControlPlaneTreeDataProvider from "../providers/controlPlaneTreeData/explorer";
import Logger from "../common/logger";

export default class ControlPlaneController {
  public static async showAddControlPlaneForm(controlPlaneTreeProvider: ControlPlaneTreeDataProvider): Promise<void>{
    const serviceUrlInputOptions: vscode.InputBoxOptions = {
      prompt: "Enter the URL of the Control Plane",
      placeHolder: "http://localhost:8090",
      ignoreFocusOut: true,
      validateInput: (value: string) => {
        if (value === null || value === undefined || value.length === 0) {
          return "Control Plane API URL is required";
        }

        try{
          new URL(value);
        }catch{
          return "Control plane address needs to be a valid URL";
        }
      }
    };

    const serviceNameInputOptions: vscode.InputBoxOptions = {
      prompt: "Enter a name for the Control Plane",
      placeHolder: "my-super-cool-control-plane",
      ignoreFocusOut: true,
      validateInput: (value: string) => {
        if (value === null || value === undefined || value.length === 0) {
          return "Control Plane name is required";
        }
      }
    };

    const apiGatewayInputOptions: vscode.InputBoxOptions = {
      prompt: "Enter the websocket address of the API Gateway",
      placeHolder: "ws://localhost:8091",
      ignoreFocusOut: true,
      validateInput: (value: string) => {
        if (value === null || value === undefined || value.length === 0) {
          return "Control Plane API URL is required";
        }

        try{
          new URL(value);
        }catch{
          return "Gateway API address needs to be a valid URL";
        }
      }
    };

    // Prompt for control plane URL
    const webServiceUrl = await vscode.window.showInputBox(serviceUrlInputOptions);
    if (webServiceUrl === null || webServiceUrl === undefined) {
      return;
    }

    // Prompt for gateway API URL
    const gatewayApiUrl = await vscode.window.showInputBox(apiGatewayInputOptions);
    if (gatewayApiUrl === null || gatewayApiUrl === undefined) {
      return;
    }

    // Prompt for a name
    const webServiceName = await vscode.window.showInputBox(serviceNameInputOptions);
    if (webServiceName === null || webServiceName === undefined) {
      return;
    }

    //Save the control plane settings
    const savedControlPlane: TSavedControlPlane = {
      name: webServiceName,
      webServiceUrl: webServiceUrl,
      apiGatewayUrl: gatewayApiUrl
    };

    try{
      await ConfigurationProvider.saveControlPlane(savedControlPlane);
    }catch (e:any) {
      Logger.error('Save control plane', e);
      vscode.window.showErrorMessage(`Failed to save control plane: ${e.message}`);
    }finally {
      controlPlaneTreeProvider.refresh();
    }
  }

  public static async removedSavedControlPlane(explorerName: ControlPlaneNode, controlPlaneTreeProvider: ControlPlaneTreeDataProvider): Promise<void> {
    const controlPlaneName = explorerName.label as string;

    const savedControlPlanes = ConfigurationProvider.getSavedControlPlanes();

    const savedControlPlane = savedControlPlanes.find((controlPlane) => controlPlane.name.toLowerCase() === controlPlaneName.toLowerCase());

    if (savedControlPlane === undefined) {
      return;
    }

    try{
      await ConfigurationProvider.removeControlPlane(savedControlPlane);
    }catch (e:any) {
      Logger.error('Remove control plane', e);
      vscode.window.showErrorMessage(`Failed to remove control plane: ${e.message}`);
    }finally {
      controlPlaneTreeProvider.refresh();
    }
  }
}