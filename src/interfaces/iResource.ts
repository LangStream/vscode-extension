import * as models from "../services/controlPlaneApi/gen/models";

/**
 *
 * @export
 * @interface IResource
 */
export interface IResource {
  /**
   *
   * @type {string}
   * @memberof Resource
   */
  'id'?: string;
  /**
   *
   * @type {string}
   * @memberof Resource
   */
  'name': string;
  /**
   *
   * @type {string}
   * @memberof Resource
   */
  'type': string;
  /**
   *
   * @type {{ any }}
   * @memberof Resource
   */
  'configuration'?: any;
}