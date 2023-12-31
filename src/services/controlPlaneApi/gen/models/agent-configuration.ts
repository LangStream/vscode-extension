/* tslint:disable */
/* eslint-disable */
/**
 * Project API
 * Project description API
 *
 * The version of the OpenAPI document: undefined
 * 
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */


// May contain unused imports in some cases
// @ts-ignore
import { Connection } from './connection';
// May contain unused imports in some cases
// @ts-ignore
import { ErrorsSpec } from './errors-spec';
// May contain unused imports in some cases
// @ts-ignore
import { ResourcesSpec } from './resources-spec';

/**
 * 
 * @export
 * @interface AgentConfiguration
 */
export interface AgentConfiguration {
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
    'input'?: Connection;
    /**
     * 
     * @type {Connection}
     * @memberof AgentConfiguration
     */
    'output'?: Connection;
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
    'resources'?: ResourcesSpec;
    /**
     * 
     * @type {ErrorsSpec}
     * @memberof AgentConfiguration
     */
    'errors'?: ErrorsSpec;
}

