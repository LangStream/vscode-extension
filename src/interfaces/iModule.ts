import * as models from "../services/controlPlaneApi/gen/models";
import {IPipeline} from "./iPipeline";

/**
 *
 * @export
 * @interface IModule
 */
export interface IModule {
  /**
   *
   * @type {string}
   * @memberof IModule
   */
  'id'?: string;
  /**
   *
   * @type {string}
   * @memberof IModule
   */
  'name': string;
  /**
   *
   * @type {IPipeline[]}
   * @memberof IModule
   */
  'pipelines': IPipeline[];
  /**
   *
   * @type {TopicDefinition[]}
   * @memberof IModule
   */
  'topics': models.TopicDefinition[];
}