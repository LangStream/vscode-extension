import {IComputeCluster} from "./iComputeCluster";
import {IStreamingCluster} from "./iStreamingCluster";

/**
 *
 * @export
 * @interface IInstance
 */
export interface IInstance {
  /**
   *
   * @type {IStreamingCluster}
   * @memberof Instance
   */
  'streamingCluster': IStreamingCluster;
  /**
   *
   * @type {IComputeCluster}
   * @memberof Instance
   */
  'computeCluster': IComputeCluster;
  /**
   *
   * @type {{ [key: string]: object; }}
   * @memberof Instance
   */
  'globals'?: { [key: string]: object; };
}