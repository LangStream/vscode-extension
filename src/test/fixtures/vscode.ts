declare module "vscode" {
  export namespace window {
    export function showErrorMessage(message: string): Thenable<string | undefined>;
  }
}