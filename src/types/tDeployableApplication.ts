import {TSavedControlPlane} from "./tSavedControlPlane";
import { ApplicationDescription} from "../services/controlPlaneApi/gen";
import {PathLike} from "fs";
import {IDependency} from "../interfaces/iDependency";

export default interface TDeployableApplication {
  id:string;
  name: string;
  modulePath: PathLike;
  configurationPath?: PathLike;
  instancePath?: PathLike;
  secretsPath?: PathLike;
  gatewaysPath?: PathLike;
  pythonPath?: PathLike;
  controlPlane?: TSavedControlPlane;
  tenantName?: string;
  applicationDescription?: ApplicationDescription;

  findDependencies(): IDependency[];
}
