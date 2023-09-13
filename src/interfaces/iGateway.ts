import * as models from "../services/controlPlaneApi/gen/models";

/**
 *
 * @export
 * @interface IGateway
 */
export interface IGateway extends models.Gateway {
  /**
   *
   * @type { [key: string]: string; }
   * @memberof IGateway
   */
  parameterValues?: { [key: string]: string; };

  /**
   *
   * @type { string }
   * @memberof IGateway
   */
  authorizationToken?: string;
}