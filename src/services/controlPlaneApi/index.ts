import Builder from './builder';
import { ApplicationsApi } from './gen/apis/applications-api';
import { TenantsApi } from './gen/apis/tenants-api';
import { type AxiosInstance } from 'axios';

export default class ControlPlaneApi {
  private readonly _applications: ApplicationsApi;
  private readonly _tenants: TenantsApi;

  constructor (private readonly axiosInstance: AxiosInstance) {
    this._applications = new ApplicationsApi(undefined, axiosInstance.defaults.baseURL, axiosInstance);
    this._tenants = new TenantsApi(undefined, axiosInstance.defaults.baseURL, axiosInstance);
  }

  public static builder (): Builder {
    return new Builder();
  }

  public applications (): ApplicationsApi {
    return this._applications;
  }

  public tenants (): TenantsApi {
    return this._tenants;
  }
}