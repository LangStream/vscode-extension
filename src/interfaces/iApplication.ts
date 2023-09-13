import {IConfiguration} from "./iConfiguration";
import {IInstance} from "./iInstance";
import {ISecret} from "./iSecret";
import {IGateway} from "./iGateway";
import {IModule} from "./iModule";

/**
 *
 * @export
 * @interface IApplication
 */
export interface IApplication {
  /**
   *
   * @type {IConfiguration}
   * @memberof IApplication
   */
  configuration?: IConfiguration;
  /**
   *
   * @type {IInstance}
   * @memberof IApplication
   */
  instance?: IInstance;
  /**
   *
   * @type {ISecret[]}
   * @memberof IApplication
   */
  secrets?: ISecret[];
  /**
   *
   * @type {IGateway[]}
   * @memberof IApplication
   */
  gateways?: IGateway[];
  /**
   *
   * @type {IModule[]}
   * @memberof IApplication
   */
  modules: IModule[];
  /**
   *
   * @type {artifactFilePath:string, srcCode:string}[]}
   * @memberof IApplication
   */
  artifactFiles?: {artifactFilePath:string, srcCode:string}[];
}