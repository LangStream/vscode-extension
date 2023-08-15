import {TextDocument, TextEditor, TextDocumentShowOptions, workspace, window} from 'vscode';
import * as YAML from 'yaml';

export default class DocumentHelper {
  public static openDocument(obj: any, language: 'json'|'yaml'): Thenable<TextDocument> {
    let content = "";

    if(obj === undefined) {
      return Promise.reject('Provided object was undefined');
    }

    switch(language) {
      case 'json':
        content = JSON.stringify(obj, null, 2);
        break;
      case 'yaml':
        content = YAML.stringify(obj, null, 2);
        break;
    }

    const docOptions = {
      content: content,
      language: language,
    };

    return workspace.openTextDocument(docOptions);
  }

  public static showDocument(doc: TextDocument, readonly: boolean = false): Thenable<TextEditor> {
    const showOptions: TextDocumentShowOptions = { preview: readonly  };
    return window.showTextDocument(doc, showOptions);
  }
}