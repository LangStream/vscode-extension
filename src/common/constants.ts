// TELEMETRY
export const TELEM_KEY: string = 'xxxxxx';

// CONFIG
export const EXTENSION_CONFIG_KEY = "vs-langstream";
export const PROVIDER_CONFIGS_KEY = "controlPlanes";
export const MAX_APPLICATION_NAME_LENGTH = 40;

// LANGUAGE
export const LANGUAGE_NAME: string = 'langstream';
export const LANGUAGE_SCHEME: string = 'vs-langstream';

// COMMANDS
export const COMMAND_REFRESH_EXPLORER = 'extension.aiStreamsRefreshExplorer';
export const COMMAND_ADD_CONTROL_PLANE = 'extension.vsAiStreamsAddControlPlane';
export const COMMAND_REMOVE_CONTROL_PLANE = 'extension.aiStreamsRemoveControlPlane';
export const COMMAND_REMOVE_TENANT = 'extension.aiStreamsRemoveTenant';
export const COMMAND_ADD_TENANT = 'extension.aiStreamsAddTenant';
export const COMMAND_REMOVE_APPLICATION = 'extension.aiStreamsRemoveApplication';
export const COMMAND_INIT_APPLICATION = 'extension.aiStreamsInitApplication';
export const COMMAND_DEPLOY_APPLICATION = 'extension.aiStreamsDeployApplication';
export const COMMAND_UPDATE_APPLICATION = 'extension.aiStreamsUpdateApplication';
export const COMMAND_VIEW_APPLICATION_DETAILS = 'extension.aiStreamsApplicationDetails';
export const COMMAND_VIEW_WORKER_LOGS = 'extension.aiStreamsWorkerLogs';
export const COMMAND_VIEW_APPLICATION_RUNTIME = 'extension.aiStreamsViewApplicationRuntime';
export const COMMAND_OPEN_GATEWAY_EDITOR = 'extension.aiStreamsOpenGatewayEditor';
export const COMMAND_OPEN_APP_LOGS_EDITOR = 'extension.aiStreamsOpenAppLogsEditor';
export const COMMAND_OPEN_APP_LOGS_FROM_DEPLOY = "extension.aiStreamsOpenAppLogsEditorFromDeploy";
export const COMMAND_VIEW_OUTPUT_WINDOW = "extension.aiStreamsViewOutputWindow";

// PROVIDERS
export const CONTROL_PLANE_TREE = 'extension.aiStreamsExplorer';
export const GATEWAY_CUSTOM_EDITOR_VIEW_TYPE: string = 'extension.gatewayCustomEditor';
export const APP_LOGS_CUSTOM_EDITOR_VIEW_TYPE: string = 'extension.appLogsCustomEditor';

export const CONTEXT_VALUES = {
  error: 'aiStreams.error',
  message: 'aiStreams.message',
  controlPlane: 'aiStreams.controlPlane',
  folder: 'aiStreams.folder',
  tenant: 'aiStreams.tenant',
  application: 'aiStreams.application',
  agent: 'aiStreams.agent',
  worker: 'aiStreams.worker'
};

export enum ExplorerMessageTypes {
  noTenants,
  noApplications,
  noAgents,
  noWorkers
}

export class ExplorerFolderTypes {
}