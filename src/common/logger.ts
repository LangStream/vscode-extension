import {AxiosError} from "axios";
import {OutputChannel} from "vscode";

export default class Logger {
  public static error(error: any ): void;
  public static error(message:string, error: any): void;
  public static error(message?:string, error?: any): void {
    if(typeof message === 'object'){
      error = message;
    }else{
      thisConsole.error(message);
    }

    if(error === undefined){
      return;
    }

    if(error instanceof AxiosError){
      thisConsole.error(JSON.stringify({
        code: error.code,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      }, null, 2));
      return;
    }

    if(error.data !== undefined){
      thisConsole.error(JSON.stringify({
        status: error.status,
        statusText: error.statusText,
        data: error.data
      }, null, 2));
      return;
    }

    thisConsole.error(JSON.stringify(error, null, 2));
  }

  public static info(obj: any): void;
  public static info(message: string, obj: any): void;
  public static info(message?: string, obj?: any): void {
    if(typeof message === 'object'){
      obj = message;
    }else{
      thisConsole.info(message);
    }

    if(obj){
      thisConsole.info(JSON.stringify(obj, null, 2));
    }
  }

  public static debug(obj: any): void;
  public static debug(message:string, obj: any): void;
  public static debug(message?: string, obj?: any): void {
    if(typeof message === 'object'){
      obj = message;
    }else{
      thisConsole.debug(message);
    }

    // if(typeof obj === 'object'){
    //   thisConsole.debug(JSON.stringify(obj, null, 2));
    // }
  }

  public static warn(obj: any): void;
  public static warn(message:string, obj: any): void;
  public static warn(message?: string, obj?: any): void {
    if(typeof message === 'object'){
      obj = message;
    }else{
      thisConsole.warn(message);
    }

    if(obj){
      thisConsole.warn(JSON.stringify(obj, null, 2));
    }
  }
}

let thisConsole: any;
let outputChannel: OutputChannel;

try{
  const vscode = require("vscode");
  outputChannel = vscode.window.createOutputChannel("AI Streams");
  thisConsole = {
    info: (...args: any[]) => outputChannel.appendLine("[INFO] " + args.join(" ")),
    error: (...args: any[]) => outputChannel.appendLine("[ERROR] " + args.join(" ")),
    debug: (...args: any[]) => outputChannel.appendLine("[DEBUG] " + args.join(" ")),
    warn: (...args: any[]) => outputChannel.appendLine("[WARN] " + args.join(" "))
  };
}catch(e){
  thisConsole = console;
}