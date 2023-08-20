import ControlPlaneApi from "./controlPlaneApi";
import {ApplicationDescription, TenantConfiguration} from "./controlPlaneApi/gen/models";
import axios, {Axios, AxiosError, AxiosRequestConfig} from "axios";
import * as path from "path";
import * as fs from "fs";
import {sleep} from "../utils/sleep";

export default class ControlPlaneService {
  protected readonly client: ControlPlaneApi;

  constructor(private readonly webServiceUrl: string, private readonly token?: string) {
    if (webServiceUrl === null || webServiceUrl === undefined) {
      throw new Error("Web service url is required");
    }

    if (token === undefined) {
      this.client = ControlPlaneApi.builder()
        .serviceHttpUrl(webServiceUrl)
        .build();
    } else {
      this.client = ControlPlaneApi.builder()
        .serviceHttpUrl(webServiceUrl)
        .tokenAuthentication(token)
        .build();
    }
  }

  private async queryControlPlaneClient<T>(fn: Promise<any>, def: T, errorOnNotFound: boolean = true): Promise<T> {
    return new Promise((resolve, reject) => {
      fn.then((response: any) => {
        if (response.status > 199 && response.status < 300) {
          resolve(response.data);
          return;
        }

        reject(response);
      }).catch((err: any) => {
        if(true === this.shouldRejectError(err, errorOnNotFound)) {
          reject(err);
          return;
        }

        resolve(def);
      });
    });
  }

  private shouldRejectError(err: any, errorOnNotFound: boolean): boolean {
    if (false === err instanceof AxiosError) {
      return true;
    }

    const isNotFoundError = (err.code === 'ERR_BAD_REQUEST'
      && err.response?.status === 404
      && err.response?.data?.detail?.toLowerCase().indexOf('not found') > -1);

    return isNotFoundError && errorOnNotFound;
  }

  public async listTenantNames(): Promise<string[]> {
    return new Promise<string[]>((resolve, reject) => {
      this.queryControlPlaneClient<{[p: string]: TenantConfiguration}>(this.client.tenants().getTenants(), {}).then((tenantConfigs: {[p: string]: TenantConfiguration} ) => {
        const tenantNames: string[] = [];

        Object.keys(tenantConfigs).forEach((key) => {
          const value = tenantConfigs[key];
          if(value?.name !== undefined) {
            tenantNames.push(value.name);
          }
        });

        resolve(tenantNames);
      }).catch((err: any) => {
        reject(err);
      });
    });
  }

  public async getTenant(tenantName: string): Promise<TenantConfiguration | undefined> {
    return this.queryControlPlaneClient<TenantConfiguration | undefined>(this.client.tenants().getTenant(tenantName), undefined, false);
  }

  public async listApplicationIds(tenantName: string): Promise<string[]> {
    return new Promise<string[]>((resolve, reject) => {
      this.queryControlPlaneClient<ApplicationDescription[]>(this.client.applications().getApplications(tenantName), []).then((applicationDescriptions) => {
        const applicationIds: string[] = [];

        applicationDescriptions.forEach((appDesc) => {
          if(appDesc["application-id"] !== undefined) {
            applicationIds.push(appDesc["application-id"]);
          }
        });

        resolve(applicationIds);
      }).catch((err: any) => {
        reject(err);
      });
    });
  }

  public async getApplication(tenantName: string, applicationName: string): Promise<ApplicationDescription | undefined> {
    return this.queryControlPlaneClient<ApplicationDescription | undefined>(this.client.applications().getApplication(tenantName, applicationName), undefined, false);
  }

  public async deleteTenant(tenantName: string): Promise<void> {
    return this.queryControlPlaneClient<void>(this.client.tenants().deleteTenant(tenantName), undefined, false);
  }

  public async deleteApplication(tenantName: string, applicationId: string): Promise<void> {
    return this.queryControlPlaneClient<void>(this.client.applications().deleteApplication(tenantName, applicationId), undefined, true);
  }

  public async addTenant(tenantName: string): Promise<void> {
    return this.queryControlPlaneClient<void>(this.client.tenants().putTenant(tenantName), undefined, true);
  }

  public async deployApplication(tenantName: string,
                                 applicationId: string,
                                 applicationArtifactPath: fs.PathLike,
                                 instanceManifestPath: fs.PathLike,
                                 secretsManifestPath?: fs.PathLike): Promise<void> {
    const options: AxiosRequestConfig = {
      headers: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        'Content-Type': 'multipart/form-data'
      },
      baseURL: this.webServiceUrl,
      transformRequest: axios.defaults.transformRequest,
      transformResponse: axios.defaults.transformResponse,
    };

    const url = new URL(this.webServiceUrl);
    url.pathname = path.join("api", "applications", <string>tenantName, <string>applicationId);

    const data:any = {
      app: fs.createReadStream(applicationArtifactPath),
      instance: fs.readFileSync(instanceManifestPath)
    };

    if(secretsManifestPath !== undefined) {
      data.secrets = fs.readFileSync(secretsManifestPath);
    }

    return this.queryControlPlaneClient<void>(
      new Axios(options).post(url.href, data),
      undefined);
  }

  public async updateApplication(tenantName: string,
                                 applicationId: string,
                                applicationArtifactPath: fs.PathLike,
                                instanceManifestPath: fs.PathLike,
                                secretsManifestPath?: fs.PathLike): Promise<void> {
    const options: AxiosRequestConfig = {
      headers: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        'Content-Type': 'multipart/form-data'
      },
      baseURL: this.webServiceUrl,
      transformRequest: axios.defaults.transformRequest,
      transformResponse: axios.defaults.transformResponse,
    };

    const url = new URL(this.webServiceUrl);
    url.pathname = path.join("api", "applications", <string>tenantName, <string>applicationId);

    const data:any = {
      app: fs.createReadStream(applicationArtifactPath),
      instance: fs.readFileSync(instanceManifestPath)
    };

    if(secretsManifestPath !== undefined) {
      data.secrets = fs.readFileSync(secretsManifestPath);
    }

    return this.queryControlPlaneClient<void>(
      new Axios(options).patch(url.href, data),
      undefined);
  }

  public async getApplicationLogs(tenantName: string, applicationId: string, filter?: string[]): Promise<string> {
    const options: AxiosRequestConfig = {
      headers: {
        accept: 'application/x-ndjson'
      },
      baseURL: this.webServiceUrl,
      transformRequest: axios.defaults.transformRequest,
      transformResponse: axios.defaults.transformResponse,
      responseType: "stream"
    };

    const url = new URL(this.webServiceUrl);
    url.pathname = path.join("api", "applications", <string>tenantName, <string>applicationId, "logs");

    if(filter !== undefined){
      url.searchParams.set("filter", filter.join(","));
    }

    return new Promise<string>(async (resolve, reject) => {
      new Axios(options).get(url.href).then(async (axiosResponse) => {
        if (axiosResponse === undefined) {
          reject(new Error('No response'));
          return;
        }

        const stream = axiosResponse.data;

        stream.on('data', (data: any) => {
          console.log(data.toString());
        });

        stream.on('end', () => {
          console.log("stream done");
        });

        while (!stream.complete) {
          console.log("waiting");
          await sleep(1000);
        }

        resolve(axiosResponse.data?.toString());
      }).catch((err: any) => {
        reject(err);
      });
    });
  }
}