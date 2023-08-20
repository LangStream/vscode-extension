// TELEMETRY
import {nodeModules} from "ts-loader/dist/constants";

export const TELEM_KEY: string = 'xxxxxx';

// CONFIG
export const EXTENSION_CONFIG_KEY = "vs-langstream";
export const PROVIDER_CONFIGS_KEY = "controlPlanes";
export const MAX_APPLICATION_NAME_LENGTH = 40;

// LANGUAGE
export const LANGUAGE_NAME: string = 'langstream';
export const LANGUAGE_SCHEME: string = 'vs-langstream';

// COMMANDS
export const COMMAND_REFRESH_EXPLORER = 'extension.langStreamRefreshExplorer';
export const COMMAND_ADD_CONTROL_PLANE = 'extension.vsLangStreamAddControlPlane';
export const COMMAND_REMOVE_CONTROL_PLANE = 'extension.langStreamRemoveControlPlane';
export const COMMAND_REMOVE_TENANT = 'extension.langStreamRemoveTenant';
export const COMMAND_ADD_TENANT = 'extension.langStreamAddTenant';
export const COMMAND_REMOVE_APPLICATION = 'extension.langStreamRemoveApplication';
export const COMMAND_INIT_APPLICATION = 'extension.langStreamInitApplication';
export const COMMAND_DEPLOY_APPLICATION = 'extension.langStreamDeployApplication';
export const COMMAND_UPDATE_APPLICATION = 'extension.langStreamUpdateApplication';
export const COMMAND_VIEW_APPLICATION_DETAILS = 'extension.langStreamApplicationDetails';
export const COMMAND_OPEN_GATEWAY_EDITOR = 'extension.langStreamOpenGatewayEditor';
export const COMMAND_OPEN_APP_LOGS_EDITOR = 'extension.langStreamOpenAppLogsEditor';
export const COMMAND_OPEN_APP_LOGS_FROM_DEPLOY = "extension.langStreamOpenAppLogsEditorFromDeploy";
export const COMMAND_VIEW_OUTPUT_WINDOW = "extension.langStreamViewOutputWindow";

// PROVIDERS
export const CONTROL_PLANE_TREE = 'extension.langStreamExplorer';
export const GATEWAY_CUSTOM_EDITOR_VIEW_TYPE: string = 'extension.gatewayCustomEditor';
export const APP_LOGS_CUSTOM_EDITOR_VIEW_TYPE: string = 'extension.appLogsCustomEditor';

export const CONTEXT_VALUES = {
  error: 'langStream.error',
  message: 'langStream.message',
  controlPlane: 'langStream.controlPlane',
  folder: 'langStream.folder',
  tenant: 'langStream.tenant',
  application: 'langStream.application',
  agent: 'langStream.agent',
  worker: 'langStream.worker',
  module: 'langStream.module',
  gateway: 'langStream.gateway',
  pipeline: 'langStream.pipeline',
};

export enum ExplorerMessageTypes {
  noTenants,
  noApplications,
  noAgents,
  noWorkers,
  noModules,
  noGateways,
  noPipelines,
}

export enum ExplorerFolderTypes {
  moduleFolder,
  gatewayFolder
}