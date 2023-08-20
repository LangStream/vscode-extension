import * as models from "../services/controlPlaneApi/gen/models";

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
   * @type {Pipeline[]}
   * @memberof IModule
   */
  'pipelines': models.Pipeline[];
  /**
   *
   * @type {TopicDefinition[]}
   * @memberof IModule
   */
  'topics': models.TopicDefinition[];
}