'use strict';
/* eslint-disable @typescript-eslint/naming-convention */

import ConsumePushMessage from "./consumePushMessage.js";
import ProduceResponse from "./produceResponse.js";

export default class MessageManager {
  _listJs = undefined;

  constructor() {
    const listOptions = {
      valueNames: [
        'gatewayId',
        'recordKey',
        'headers',
        'payload',
        'payloadEllipse',
        { name: 'collapseLink', attr: 'data-bs-target' },
        { name: 'collapseLink', attr: 'aria-controls' },
        { name: 'collapse', attr: 'id' },
      ],
      item: 'list-item',
      listClass: 'list',
      //searchClass: 'search',
      searchColumns: ['gatewayId'],
      searchDelay: 400
    };

    this._listJs = new List('messages-list', listOptions);
    this.filter();
  }

  add(gatewayId, gatewayMessage, contentType) {
    gatewayMessage.messageId = (Math.random().toString(36).substring(2) + Date.now().toString(36));
    gatewayMessage.gatewayId = gatewayId;
    gatewayMessage.contentType = contentType ?? "text/plain";
    gatewayMessage.collapseLink = `#coll${gatewayMessage.messageId}`;
    gatewayMessage.collapse = `coll${gatewayMessage.messageId}`;

    if(gatewayMessage instanceof ConsumePushMessage){
      gatewayMessage.recordKey = gatewayMessage.record.key ?? "<span class=\"text-muted\">none</span>";
      gatewayMessage.headers = JSON.stringify(gatewayMessage.record.headers ?? "", null, 2);
      gatewayMessage.payload = gatewayMessage.record.value ?? "";
    }

    if(gatewayMessage instanceof ProduceResponse){
      if(gatewayMessage.status === "OK"){
        return; //don't log successful produce responses
      }

      gatewayMessage.recordKey = "";
      gatewayMessage.headers = "";
      gatewayMessage.payload = `[${gatewayMessage.status}] ${JSON.stringify(gatewayMessage.reason, null, 2)}`;
    }

    gatewayMessage.payloadEllipse = (gatewayMessage.payload?.length ?? "") > 100 ? '(expand to view message)' : gatewayMessage.payload;

    switch(contentType) {
      case "application/json":
        try{
          gatewayMessage.payload = JSON.stringify(JSON.parse(gatewayMessage.payload), null, 2);
        }catch{}
        break;
      case "text/html":
        try{
          gatewayMessage.payload = gatewayMessage.payload
            .replace(/&/g, '&amp')
            .replace(/'/g, '&apos')
            .replace(/"/g, '&quot')
            .replace(/>/g, '&gt')
            .replace(/</g, '&lt');
        }catch{}
        break;
    }

    console.debug(gatewayMessage);

    this._listJs.add(gatewayMessage);
    this.refreshInfo();
    this.filter();
  }

  refreshInfo(){
  }

  search(){
    // console.log("MessageManager search");
    // setTimeout(() => {
    //   this._listJs.search(document.getElementById('search-message-payload').value, ['decodedPayload']);
    // },400);
  }

  filter(){
    // const gatewayIdFilter = document.getElementById('gateway-id-filter').value || "";
    //
    // this._listJs.filter((item) => {
    //   return (gatewayIdFilter.length > 0 ? (item.values().gatewayId === gatewayIdFilter) : true);
    // });
  }

  get messages(){
    return this._listJs.items;
  }
}