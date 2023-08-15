/**
 * ProgressReport is a compatability type for vscode.Progress<{ message?: string; increment?: number }>
 */
export type ProgressReport = { message?: string | undefined, increment?: number | undefined };
/**
 * ObservableTask is a task that can be observed for progress and completion
 * @param T The type of the action result
 * @param R The type of the progress report
 * @property messages Messages to display to the user
 * @property action The action to perform
 * @property timeout The timeout for the action
 * @property pollingInterval The polling interval for the action
 * @property errorThreshold The number of errors to tolerate before failing
 * @property onProgress A function to call to report progress
 * @property complete A function to call to determine if the task is complete
 * @property onFinish A function to call when the task is finished
 */
export type TObservableTask<T> = {
  /**
   * The action to perform, in deciding the status of the task
   * @returns A promise that resolves to the result of the action
   */
  action: () => Promise<T | undefined>;

  /**
   * The time to allow the task to run
   * @returns A number in milliseconds
   */
  timeout: number;

  /**
   * The interval to run the action
   * @returns A number in milliseconds
   */
  pollingInterval: number;

  /**
   * The number of errors to tolerate before failing the task
   * @returns A number
   */
  errorThreshold: number;

  /**
   * A function that is called to report task progress
   * @param actionResult
   * @returns A ProgressReport
   */
  onProgress: (actionResult?: T) => ProgressReport;

  /**
   * A function to decide if the task completed successfully
   * @returns A boolean indicating if the task completed successfully
   * @param actionResult
   */
  complete: (hasErrors: boolean, actionResult?: T) => boolean;

  /**
   * A function to call when the task finishes (both successful and unsuccessful)
   * @param waitExpired Boolean indicating if the task timed out
   * @param wasCancelled Boolean indicating if the task was cancelled by user
   * @param hasErrors Boolean indicating if errors occurred during the task run
   */
  onFinish: (waitExpired:boolean, wasCancelled: boolean, hasErrors: boolean) => void;

  /**
   * A function to call to determine if errors occurred during the task run
   * @param actionResult
   * @returns A boolean indicating if errors occurred during the task run
   */
  hasErrors: (actionResult?: T) => boolean;
}