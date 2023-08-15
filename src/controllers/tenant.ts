import * as vscode from "vscode";
import {ITenantNode} from "../providers/controlPlaneTreeData/nodes/tenant";
import ControlPlaneTreeDataProvider from "../providers/controlPlaneTreeData/explorer";
import Logger from "../common/logger";
import {TenantConfiguration} from "../services/controlPlaneApi/gen";
import TenantService from "../services/tenant";
import WatchTenantDeletingTask from "../services/watchTenantDeletingTask";
import ProgressRunner from "../common/progressRunner";
import {IControlPlaneNode} from "../providers/controlPlaneTreeData/nodes/controlPlane";
import {URL} from "url";
import WatchTenantAddingTask from "../services/watchTenantAddingTask";

export default class TenantController {
  public static async delete(tenantNode: ITenantNode, controlPlaneTreeProvider: ControlPlaneTreeDataProvider): Promise<void> {
    const tenantService = new TenantService(tenantNode.controlPlane);
    const tenantName = <string>tenantNode.label;

    const confirmDelete = await vscode.window.showWarningMessage(`Are you sure you want to delete tenant '${tenantNode.label}'?`, { modal: true }, 'Yes', 'No');
    if (confirmDelete !== 'Yes') {
      return;
    }

    const task = new WatchTenantDeletingTask(tenantName, tenantService, controlPlaneTreeProvider);

    Logger.debug("Sending delete command");
    const deletePromises = Promise.all([
      tenantService.delete(tenantName),
      new ProgressRunner<TenantConfiguration>("Delete tenant").run(task)
    ]);

    await deletePromises.then(() => {
    }, (reason: any) => {
      Logger.error(reason);
      throw new Error(reason);
    }).finally(() => {
      controlPlaneTreeProvider.refresh();
    });
  }

  public static async add(controlPlaneNode: IControlPlaneNode, controlPlaneTreeProvider: ControlPlaneTreeDataProvider): Promise<void> {
    const tenantNameInputOptions: vscode.InputBoxOptions = {
      prompt: "Enter new tenant name",
      placeHolder: "my-tenant",
      ignoreFocusOut: true,
      validateInput: (value: string) => {
        if (value === null || value === undefined || value.length === 0) {
          return "Tenant name cannot be empty";
        }

        const nameReg = new RegExp("^[A-Za-z0-9_@./#&+-]*$");
        if (!nameReg.test(value)) {
          return "Tenant name can only contain alphanumeric characters and @./#&+-";
        }
      }
    };

    // Prompt for tenant name
    const tenantName = await vscode.window.showInputBox(tenantNameInputOptions);
    if (tenantName === null || tenantName === undefined) {
      return;
    }

    Logger.debug("Sending add command");

    const tenantService = new TenantService(controlPlaneNode.savedControlPlane);
    const task = new WatchTenantAddingTask(tenantName, tenantService, controlPlaneTreeProvider);

    const promises = Promise.all([
      tenantService.add(tenantName),
      new ProgressRunner<TenantConfiguration>("Add tenant").run(task)
    ]);

    await promises.then(() => {
    }, (reason: any) => {
      Logger.error(reason);
      throw new Error(reason);
    }).finally(() => {
      controlPlaneTreeProvider.refresh();
    });
  }
}