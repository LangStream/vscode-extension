export type TToWebviewMessage = {
  command: ToWebviewMessageCommandEnum;
  text?: string;
  gatewayId?: string;
  contentType?: string;
};

export enum ToWebviewMessageCommandEnum {
  connection = "connection",
  error = "error",
  consumeMessage = "consumeMessage",
  produceResponse = "produceResponse",
  userMessage = "userMessage",
}
