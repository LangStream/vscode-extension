'use strict';
/* eslint-disable @typescript-eslint/naming-convention */

import GatewayMessenger from './messenger.js';
import GatewayBootstrapper from './bootstrapper.js';
import Common from './Common.js';
import RecordListingView from './views/recordListing.js';
import CreateRecordView from './views/createRecord.js';

//=============================================================================
// GLOBAL CONSTANTS
//=============================================================================
const bodyTheme = document.querySelector('body')?.getAttribute('data-vscode-theme-kind');
if (bodyTheme) {
  if(bodyTheme === 'vscode-light') {
    document.querySelector('html')?.setAttribute('data-bs-theme', 'light');
  }else{
    document.querySelector('html')?.setAttribute('data-bs-theme', 'dark');
  }
}


//=============================================================================
// LOAD PAGE
//=============================================================================
window.addEventListener('load', async () => {
  const gatewayMessenger = new GatewayMessenger();
  const bootstrapModalElement = document.getElementById('bootstrapModal');
  const bootstrapper = new GatewayBootstrapper()
    .setProducers(producerGateways)
    .setConsumers(consumerGateways)
    .build();

  bootstrapper.checkForValues(bootstrapModalElement).then(() => {
    RecordListingView.initialize();

    const createRecordModalElement = document.getElementById('createRecordViewModal');
    const createRecordModal = bootstrap.Modal.getOrCreateInstance(createRecordModalElement);
    const createRecordView = new CreateRecordView();
    createRecordView.initialize(createRecordModalElement, gatewayMessenger);

    document.getElementById('producer-gateway-id').addEventListener('change', (e) => {
      document.getElementById("show-create-record-button").disabled = !(document.getElementById("producer-gateway-id").value?.length > 0);
    });

    document.getElementById('show-create-record-button').addEventListener('click', () => {
      createRecordModal.show(document.getElementById('producer-gateway-id').value);
    });

    gatewayMessenger.sendMessage("ready");
  }).catch((err) => {
    Common.showError(err);
  });
});
