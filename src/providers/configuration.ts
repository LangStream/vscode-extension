import * as vscode from 'vscode';
import {TSavedControlPlane} from "../types/tSavedControlPlane";
import {PROVIDER_CONFIGS_KEY, EXTENSION_CONFIG_KEY} from "../common/constants";

type ConfigUpdater<T> = (configKey: string, value: T, scope: vscode.ConfigurationTarget, valueAtScope: any, createIfNotExist: boolean) => Promise<void>;

export default class ConfigurationProvider {
  public static getConfigValue(configKey: string) {
    return vscode.workspace.getConfiguration(EXTENSION_CONFIG_KEY)[configKey];
  }

  private static async addPathToConfig(configKey: string, value: string): Promise<void> {
    await this.setConfigValue(configKey, value);
  }

  private static async setConfigValue(configKey: string, value: any): Promise<void> {
    await this.atAllConfigScopes(this.addValueToConfigAtScope, configKey, value);
  }

  private static async atAllConfigScopes<T>(fn: ConfigUpdater<T>, configKey: string, value: T): Promise<void> {
    const config = vscode.workspace.getConfiguration().inspect(EXTENSION_CONFIG_KEY)!;
    await fn(configKey, value, vscode.ConfigurationTarget.Global, config.globalValue, true);
    await fn(configKey, value, vscode.ConfigurationTarget.Workspace, config.workspaceValue, false);
    await fn(configKey, value, vscode.ConfigurationTarget.WorkspaceFolder, config.workspaceFolderValue, false);
  }

  private static async addValueToConfigAtScope(configKey: string, value: any, scope: vscode.ConfigurationTarget, valueAtScope: any, createIfNotExist: boolean): Promise<void> {
    if (!createIfNotExist) {
      if (!valueAtScope || !(valueAtScope[configKey])) {
        return;
      }
    }

    let newValue: any = {};
    if (valueAtScope) {
      newValue = Object.assign({}, valueAtScope);
    }
    newValue[configKey] = value;
    await vscode.workspace.getConfiguration().update(EXTENSION_CONFIG_KEY, newValue, scope);
  }

  private static async addValueToConfigArray(configKey: string, value: any): Promise<void> {
    await this.atAllConfigScopes(this.addValueToConfigArrayAtScope, configKey, value);
  }

  private static async removeValueFromConfigArray(configKey: string, removeIndex: number): Promise<void> {
    await this.atAllConfigScopes(this.removeValueFromConfigArrayAtScope, configKey, removeIndex);
  }

  private static async addValueToConfigArrayAtScope(configKey: string, value: any, scope: vscode.ConfigurationTarget, valueAtScope: any, createIfNotExist: boolean): Promise<void> {
    if (!createIfNotExist) {
      if (!valueAtScope || !(valueAtScope[configKey])) {
        return;
      }
    }

    let newValue: any = {};
    if (valueAtScope) {
      newValue = Object.assign({}, valueAtScope);
    }
    const arrayEntry: string[] = newValue[configKey] || [];
    arrayEntry.push(value);
    newValue[configKey] = arrayEntry;
    await vscode.workspace.getConfiguration().update(EXTENSION_CONFIG_KEY, newValue, scope);
  }

  private static async removeValueFromConfigArrayAtScope(configKey: string,
                                                         removeIndex: number,
                                                         scope: vscode.ConfigurationTarget,
                                                         valueAtScope: any,
                                                         createIfNotExist: boolean): Promise<void> {
    if (!createIfNotExist) {
      if (!valueAtScope || !(valueAtScope[configKey])) {
        return;
      }
    }

    let newValue: any = {};
    if (valueAtScope) {
      newValue = Object.assign({}, valueAtScope);
    }
    const arrayEntry: string[] = newValue[configKey] || [];
    arrayEntry.splice(removeIndex, 1);
    newValue[configKey] = arrayEntry;
    await vscode.workspace.getConfiguration().update(EXTENSION_CONFIG_KEY, newValue, scope);
  }

  public static getSavedControlPlanes(): TSavedControlPlane[] {
    const savedConfigs = vscode.workspace.getConfiguration(EXTENSION_CONFIG_KEY)[PROVIDER_CONFIGS_KEY];
    return !savedConfigs || !savedConfigs.length ? [] : savedConfigs as TSavedControlPlane[];
  }

  public static async saveControlPlane(clusterConfiguration: TSavedControlPlane) {
    await this.addValueToConfigArray(PROVIDER_CONFIGS_KEY, clusterConfiguration);
  }

  public static async removeControlPlane(clusterConfiguration: TSavedControlPlane) {
    const removeIdx = vscode.workspace.getConfiguration(EXTENSION_CONFIG_KEY)[PROVIDER_CONFIGS_KEY].findIndex((config: TSavedControlPlane) => {
      return config === clusterConfiguration;
    });

    await this.removeValueFromConfigArray(PROVIDER_CONFIGS_KEY, removeIdx);
  }

  public affectsUs(change: vscode.ConfigurationChangeEvent) {
    return change.affectsConfiguration(EXTENSION_CONFIG_KEY);
  }
}