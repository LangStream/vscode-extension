import {TSavedControlPlane} from "./tSavedControlPlane";
import {Dependency, StoredApplication} from "../services/controlPlaneApi/gen";
import {PathLike} from "fs";

export default interface TDeployableApplication {
  id:string;
  name: string;
  modulePath: PathLike;
  configurationPath?: PathLike;
  instancePath?: PathLike;
  secretsPath?: PathLike;
  gatewaysPath?: PathLike;
  controlPlane?: TSavedControlPlane;
  tenantName?: string;
  storedApplication?: StoredApplication;

  findDependencies(): Dependency[];
}