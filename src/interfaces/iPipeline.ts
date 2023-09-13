import * as models from "../services/controlPlaneApi/gen/models";
import {IAgentConfiguration} from "./iAgentConfiguration";

/**
 *
 * @export
 * @interface Pipeline
 */
export interface IPipeline {
  /**
   *
   * @type {string}
   * @memberof Pipeline
   */
  'id'?: string;
  /**
   *
   * @type {string}
   * @memberof Pipeline
   */
  'module'?: string;
  /**
   *
   * @type {string}
   * @memberof Pipeline
   */
  'name'?: string;
  /**
   *
   * @type {ResourcesSpec}
   * @memberof Pipeline
   */
  'resources'?: models.ResourcesSpec;
  /**
   *
   * @type {ErrorsSpec}
   * @memberof Pipeline
   */
  'errors'?: models.ErrorsSpec;
  /**
   *
   * @type {IAgentConfiguration[]}
   * @memberof Pipeline
   */
  'agents'?: IAgentConfiguration[];
}