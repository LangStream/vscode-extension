import {ToWebviewMessageCommandEnum, TToWebviewMessage} from "../../types/tToWebviewMessage";

export class ToWebviewMessage implements TToWebviewMessage {
  public readonly text: string;

  constructor(public readonly command: ToWebviewMessageCommandEnum,
              message?: any) {
    if (typeof message === "string") {
      this.text = message;
    } else {
      this.text = JSON.stringify(message);
    }
  }
}