import CassandraSinkExampleApplication from "./cassandraSink";
import ComputeOpenAIEmbeddingsExampleApplication from "./computeOpenAIEmbeddings";
import ComputeVertexEmbeddingsExampleApplication from "./computeVertexAIEmbeddings";
import HuggingfaceCompletionExampleApplication from "./huggingfaceCompletion";
import OpenAICompletionExampleApplication from "./openAICompletion";
import QueryCassandraExampleApplication from "./queryCassandra";
import S3SourceExampleApplication from "./s3Source";
import ScaffoldExampleApplication from "./scaffold";
import SimpleTextProcessingExampleApplication from "./simpleTextProcessing";
import PythonSourceScaffoldExampleApplication from "./pythonSourceScaffold";
import PythonFunctionScaffoldExampleApplication from "./pythonFunctionScaffold";
import {IExampleApplication} from "../../interfaces/iExampleApplication";

export default class ExampleApplicationRegistry {
  private static _instance: ExampleApplicationRegistry;
  private _exampleApplications: IExampleApplication[] = [];

  public static get instance(): ExampleApplicationRegistry {
    if (!ExampleApplicationRegistry._instance) {
        ExampleApplicationRegistry._instance = new ExampleApplicationRegistry();
    }

    return ExampleApplicationRegistry._instance;
  }

  public get exampleApplications(): IExampleApplication[] {
    return this._exampleApplications;
  }

  public registerExampleApplication(exampleApplication: IExampleApplication): void {
    this._exampleApplications.push(exampleApplication);
  }

  public registerAllExampleApplications(extensionUriPath: string): void {
    this.registerExampleApplication(new CassandraSinkExampleApplication(extensionUriPath));
    this.registerExampleApplication(new ComputeOpenAIEmbeddingsExampleApplication(extensionUriPath));
    this.registerExampleApplication(new ComputeVertexEmbeddingsExampleApplication(extensionUriPath));
    this.registerExampleApplication(new HuggingfaceCompletionExampleApplication(extensionUriPath));
    this.registerExampleApplication(new OpenAICompletionExampleApplication(extensionUriPath));
    this.registerExampleApplication(new QueryCassandraExampleApplication(extensionUriPath));
    this.registerExampleApplication(new S3SourceExampleApplication(extensionUriPath));
    this.registerExampleApplication(new ScaffoldExampleApplication());
    this.registerExampleApplication(new SimpleTextProcessingExampleApplication(extensionUriPath));
    this.registerExampleApplication(new PythonSourceScaffoldExampleApplication(extensionUriPath));
    this.registerExampleApplication(new PythonFunctionScaffoldExampleApplication(extensionUriPath));
  }
}