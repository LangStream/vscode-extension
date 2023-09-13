import * as models from "../services/controlPlaneApi/gen/models";

/**
 *
 * @export
 * @interface AgentConfiguration
 */
export interface IAgentConfiguration {
  /**
   *
   * @type {string}
   * @memberof AgentConfiguration
   */
  'id'?: string;
  /**
   *
   * @type {string}
   * @memberof AgentConfiguration
   */
  'name'?: string;
  /**
   *
   * @type {string}
   * @memberof AgentConfiguration
   */
  'type'?: string;
  /**
   *
   * @type {Connection}
   * @memberof AgentConfiguration
   */
  'input'?: models.Connection;
  /**
   *
   * @type {Connection}
   * @memberof AgentConfiguration
   */
  'output'?: models.Connection;
  /**
   *
   * @type {{ [key: string]: object; }}
   * @memberof AgentConfiguration
   */
  'configuration'?: { [key: string]: object; };
  /**
   *
   * @type {ResourcesSpec}
   * @memberof AgentConfiguration
   */
  'resources'?: models.ResourcesSpec;
  /**
   *
   * @type {ErrorsSpec}
   * @memberof AgentConfiguration
   */
  'errors'?: models.ErrorsSpec;
  /**
   *
   * @type {ExecutorDescription}
   * @memberof AgentConfiguration
   */
  executor?: models.ExecutorDescription;
}