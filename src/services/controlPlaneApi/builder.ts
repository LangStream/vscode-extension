import ControlPlaneApi from './index';
import axios from 'axios';

export default class Builder {
  private _serviceUrl: string = '';
  private _token: string = '';

  public serviceHttpUrl (serviceUrl: string): Builder {
    if (serviceUrl === null) {
      throw new Error('Service url is a required value');
    }

    this._serviceUrl = serviceUrl;

    return this;
  }

  public tokenAuthentication (token: string): Builder {
    if (token === null) {
      throw new Error('Token is a required value');
    }

    this._token = token;
    return this;
  }

  public build (): ControlPlaneApi {
    if (this._serviceUrl.endsWith('/')) {
      this._serviceUrl = this._serviceUrl.substring(0, this._serviceUrl.length - 1);
    }

    const service = axios.create({
      baseURL: this._serviceUrl,
      headers: {Authorization: 'Bearer ' + this._token}
    });

    return new ControlPlaneApi(service);
  }
}