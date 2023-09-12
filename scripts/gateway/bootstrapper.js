'use strict';

import Common from './Common.js';

export default class GatewayBootstrapper {
  producerGateways;
  consumerGateways;
  discoveredParameters;
  discoveredAuthentications;
  messenger;

  constructor(messenger) {
    this.messenger = messenger;
    this.producerGateways = [];
    this.consumerGateways = [];
    this.discoveredParameters = {};
    this.discoveredAuthentications = [];
  }
  setProducers(producerGateways) {
    this.producerGateways = producerGateways;
    return this;
  }
  setConsumers(consumerGateways) {
    this.consumerGateways = consumerGateways;
    return this;
  }
  build() {
    const allGateways = this.producerGateways.concat(this.consumerGateways);

    // Loop through gateways and find things
    allGateways.forEach(gateway => {
      if((gateway.parameters ?? null) === null && (gateway.authentication ?? null) === null) {
        return; //shortcut
      }

      if((gateway.parameters ?? null) !== null) {
        gateway.parameters?.forEach(parameter => {
          if(this.discoveredParameters[parameter] === undefined) {
            this.discoveredParameters[parameter] = [];
          }

          this.discoveredParameters[parameter].push(gateway.id);
        });
      }

      if((gateway.authentication ?? null) !== null) {
        const existingAuth = this.discoveredAuthentications.find((discoveredAuth) => discoveredAuth[1].provider === gateway.authentication.provider &&
          discoveredAuth[1].configuration.clientId === gateway.authentication.configuration.clientId);

        if(existingAuth === undefined) {
          this.discoveredAuthentications.push([[gateway.id], gateway.authentication]);
        }else{
          existingAuth[0].push(gateway.id);
        }
      }
    });

    return this;
  }
  checkForValues(bootstrapModalElement) {
    return new Promise((resolve, reject) => {
      if(this.discoveredParameters.length === 0 && this.discoveredAuthentications.length === 0) {
        resolve(); // shortcut
      }

      // Look for the values first
      if(this.hasValues()) {
        resolve();
      }

      //If not there, then build the view
      this.buildView(bootstrapModalElement, resolve);
    });
  }
  hasValues(){
    // this.discoveredParameters.forEach((parameterObj) => {
    //   parameterObj.parameterValues[param.key]
    // });

    const allGateways = this.producerGateways.concat(this.consumerGateways);

    let totalAuths = 0;
    let foundAuths = 0;
    this.discoveredAuthentications.forEach((authObj) => {
      const [gatewayIds, authenticationObj] = authObj;
      totalAuths += gatewayIds.length;

      const authGateways = allGateways.find(gateway =>
                                              gateway.authorizationToken !== undefined &&
                                              gateway.authentication.configuration.clientId === authenticationObj.configuration.clientId);
      foundAuths += authGateways?.length;
    });

    let totalParams = 0;
    let foundParams = 0;
    Object.keys(this.discoveredParameters).forEach((parameterName) => {
      const gatewayIds = this.discoveredParameters[parameterName];

      totalParams += gatewayIds.length;

      const paramGateways = allGateways.find(gateway =>
                                              gateway.parameterValues !== undefined &&
                                              gateway.parameterValues[parameterName] !== undefined);
      foundParams += paramGateways?.length;
    });

    return (totalAuths === foundAuths && totalParams === foundParams);
  }
  buildView(bootstrapModalElement, cb){
    const paramsPlaceholder = document.getElementById('parameters-placeholder');

    this.discoveredParameters.forEach((parameterObj) => {
      const parameterName = Object.keys(parameterObj)[0];
      const gatewayIds = parameterObj[key];

      const div = document.createElement('div');

      div.innerHTML = `<div class="card mb-3">
          <div class="row g-0">
            <div class="col-md-4">
              <ul>${gatewayIds.map(gatewayId => `<li>${gatewayId}</li>`).join('')}</ul>
            </div>
            <div class="col-md-8">
              <div class="card-body">
                <div class="form-floating mb-3">
                  <input type="text" class="form-control" id="${parameterName}Input" placeholder="" onblur="postParamChangeMessage('', '${parameterName}', document.getElementById('${parameterName}Input').value)">
                  <label for="${parameterName}Input">${parameterName}</label>
                </div>
                <div class="text-center">or</div>
                <div class="text-center">
                  <button class="btn btn-outline-success" type="button" onclick="Common.createUUID(document.getElementById('${parameterName}Input'))">Gen UUID</button>
                </div>
              </div>
            </div>
          </div>
        </div>`;

      paramsPlaceholder.appendChild(div);
    });

    const authPlaceholder = document.getElementById('authentications-placeholder');

    this.discoveredAuthentications.forEach((authObj) => {
      const [gatewayIds, authenticationObj] = authObj;
      const clientId = authenticationObj.configuration.clientId;

      const div = document.createElement('div');
      div.innerHTML = `<div class="card mb-3">
          <div class="row g-0">
            <div class="col-md-4">
              <ul>${gatewayIds.map(gatewayId => `<li>${gatewayId}</li>`).join('')}</ul>
            </div>
            <div class="col-md-8">
              <div class="card-body">
                <div class="form-floating mb-3" id="${clientId}-auth-placeholder">
                </div>
              </div>
            </div>
          </div>
        </div>`;

      authPlaceholder.appendChild(div);

      switch(authObj.provider){
        case "google":
          google.accounts.id.initialize({
            // eslint-disable-next-line @typescript-eslint/naming-convention
            client_id: clientId,
            callback: (credentialResponse) => {
              document.getElementById(`${clientId}-auth-placeholder`).innerHTML = `<input type="text" disabled class="form-control" name="googleIdToken" value="${credentialResponse.credential}" />`;
              gatewayIds.forEach(gatewayId => this.postAuthChangeMessage(credentialResponse.credential, gatewayId));
            }
          });

          google.accounts.id.renderButton(
            document.getElementById(`${clientId}-auth-placeholder`),
            { theme: "outline", size: "small", text: "signin_with" }  // customization attributes
          );

          google.accounts.id.prompt(); // also display the One Tap dialog

          break;
        case "github":
          const loginUrl = "https://github.com/login/oauth/authorize?client_id=" + clientId;
          document.getElementById(`${clientId}-auth-placeholder`).innerHTML = `<a href="` + loginUrl + `">Login with GitHub</a>`;
          break;
      }
    });

    bootstrapModalElement.addEventListener('hidden.bs.modal', () => { cb(); }, {once: true});

    const bootstrapModal = bootstrap.Modal.getOrCreateInstance(bootstrapModalElement);
    bootstrapModal.show();
  }
  postAuthChangeMessage(token, gatewayId) {
    this.messenger.sendMessage("setAuthToken", token, gatewayId);

    // Update the local object
    const producerGateway = this.producerGateways.find(gateway => gateway.id === gatewayId);
    if(producerGateway !== undefined){
      producerGateway.authorizationToken = token;
    }

    const consumerGateway = this.consumerGateways.find(gateway => gateway.id === gatewayId);
    if(consumerGateway !== undefined){
      consumerGateway.authorizationToken = token;
    }
  }
  postParamChangeMessage(gatewayId, label, value) {
    const paramObj = {};
    paramObj[label] = value;

    this.messenger.sendMessage("setParamValue", JSON.stringify(paramObj), gatewayId);

    // Update the local object
    const producerGateway = this.producerGateways.find(gateway => gateway.id === gatewayId);
    if(producerGateway !== undefined){
      producerGateway.parameterValues[label] = value;
    }

    const consumerGateway = this.consumerGateways.find(gateway => gateway.id === gatewayId);
    if(consumerGateway !== undefined){
      consumerGateway.parameterValues[label] = value;
    }
  }
}