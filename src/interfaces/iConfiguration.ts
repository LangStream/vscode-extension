import {IResource} from "./iResource";
import {IDependency} from "./iDependency";

/**
 *
 * @export
 * @interface IConfiguration
 */
export interface IConfiguration {
  /**
   *
   * @type {IResource[]}
   * @memberof IConfiguration
   */
  resources: IResource[];
  /**
   *
   * @type {IDependency[]}
   * @memberof IConfiguration
   */
  dependencies: IDependency[];
}