export type TWebviewMessage = {
  command: string;
  text: string | string[];
  isError: boolean;
};