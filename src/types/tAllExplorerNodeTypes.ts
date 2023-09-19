import {IControlPlaneNode} from "../providers/controlPlaneTreeData/nodes/controlPlane";
import {ITenantNode} from "../providers/controlPlaneTreeData/nodes/tenant";
import {IMessageNode} from "../providers/controlPlaneTreeData/nodes/message";
import {IErrorNode} from "../providers/controlPlaneTreeData/nodes/error";
import {IFolderNode} from "../providers/controlPlaneTreeData/nodes/folder";
import {IModuleNode} from "../providers/controlPlaneTreeData/nodes/module";
import {IGatewayNode} from "../providers/controlPlaneTreeData/nodes/gateway";
import {IPipelineNode} from "../providers/controlPlaneTreeData/nodes/pipeline";
import {ICompositeAgentNode} from "../providers/controlPlaneTreeData/nodes/compositeAgent";

export type TAllExplorerNodeTypes =
  | IFolderNode
  | IErrorNode
  | IMessageNode
  | IControlPlaneNode
  | ITenantNode
  | ICompositeAgentNode
  | IModuleNode
  | IGatewayNode
  | IPipelineNode;