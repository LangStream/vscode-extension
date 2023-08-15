import {IControlPlaneNode} from "../providers/controlPlaneTreeData/nodes/controlPlane";
import {ITenantNode} from "../providers/controlPlaneTreeData/nodes/tenant";
import {IMessageNode} from "../providers/controlPlaneTreeData/nodes/message";
import {IErrorNode} from "../providers/controlPlaneTreeData/nodes/error";
import {IFolderNode} from "../providers/controlPlaneTreeData/nodes/folder";
import {IAgentNode} from "../providers/controlPlaneTreeData/nodes/agent";
import {IWorkerNode} from "../providers/controlPlaneTreeData/nodes/worker";

export type TAllExplorerNodeTypes =
  | IFolderNode
  | IErrorNode
  | IMessageNode
  | IControlPlaneNode
  | ITenantNode
  | IAgentNode
  | IWorkerNode;