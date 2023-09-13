import {ProgressLocation, Progress, CancellationToken, window, ProgressOptions} from "vscode";
import Logger from "./logger";
import {TObservableTask, ProgressReport} from "../types/tObservableTask";
import {sleep} from "../utils/sleep";

export default class ProgressRunner<T> {
  constructor(private readonly title: string) {}

  public async run(observableTask: TObservableTask<T>, abortSignal: AbortSignal): Promise<void> {
    const options: ProgressOptions = {
      location: ProgressLocation.Notification,
      title: this.title,
      cancellable: true,
    };

    const a = window.withProgress(options,
      async (progress: Progress<ProgressReport>, token: CancellationToken) => {
        return this.startRunner(progress, token, observableTask, abortSignal);
      });

    await a; //block until the progress is complete
  }

  private async startRunner(progress: Progress<ProgressReport>, token: CancellationToken, observableTask: TObservableTask<T>, abortSignal: AbortSignal): Promise<void> {
    return new Promise<void>(async (resolve, reject) => {
      let expired = false;
      let errorCnt = 0;
      let hasErrors = false;

      const timeout = setTimeout(() => {
        Logger.debug('Timeout callback');
        expired = true;
      }, observableTask.timeout);

      progress.report(observableTask.onProgress());

      while(!expired && !token.isCancellationRequested && !abortSignal.aborted){
        let actionResult: T | undefined;

        try{
          actionResult = await observableTask.action();
        }catch (e:any) {
          errorCnt++;
          console.log('Error in action', e);
        }

        progress.report(observableTask.onProgress(actionResult));

        if(observableTask.hasErrors(actionResult)){
          errorCnt++;
        }

        if (errorCnt > observableTask.errorThreshold) {
          hasErrors = true;
          Logger.error('Error threshold exceeded');
        }

        if (observableTask.complete(hasErrors, actionResult)) {
          clearTimeout(timeout);
          break;
        }

        await sleep(observableTask.pollingInterval);
      }

      try{
        observableTask.onFinish(expired, token.isCancellationRequested, hasErrors, abortSignal.aborted);
      }catch (e) {
        console.log('Error in onFinish', e);
        reject(e);
      }

      if(!expired || hasErrors) {
        clearTimeout(timeout);
      }

      resolve();
    });
  }
}