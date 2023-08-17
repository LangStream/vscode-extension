class MessageManager {
  _listJs = undefined;

  constructor() {
    console.log("MessageManager constructor");
    const listOptions = {
      valueNames: [ 'message' ],
      item: this.formatListItem,
      listClass: 'list',
      searchClass: 'search',
      searchColumns: ['message'],
      searchDelay: 400
    };

    this._listJs = new List('messages-list', listOptions);
    this.filter();
  }

  formatListItem(message){
    //console.log(message);
    let msgContainerClass = 'justify-content-end';
    let label =   `to`;
    let msgClass = 'text-light bg-primary';

    if(message.command === "consumeMessage"){
      msgContainerClass = 'justify-content-start';
      label = `from`;
      msgClass = 'text-dark bg-light text-start';
    }

    const messageText = message.text;

    const messageRecord = messageText.record;
    console.log(messageRecord);

    switch (message.command){
      case "userMessage":
      case "consumeMessage":

        let messagePayload = "";
        try{
          messagePayload = JSON.stringify(JSON.parse(messageRecord.value), null, 2);
        }catch{
          messagePayload = messageRecord.value;
        }

        let headers = "";
        try{
          headers = JSON.stringify(messageRecord.headers, null, 2);
        }catch{
          headers = messageRecord.headers;
        }

        return `
    <div class="w-100 d-flex ${msgContainerClass}">
        <div class="row mx-4" style="width: 52%!important;">
          <div class="col-12 rounded-3 p-1 px-2 ${msgClass}">
            <div class="row no-gutters">
              <div class="col-12"><span class="text-muted">${label}:</span> ${message.gatewayId}</div>
              <div class="col-12"><span class="text-muted">key:</span> ${messageRecord.key ?? "<span class=\"text-muted\">none</span>"}</div>
              <div class="col-12"><span class="text-muted">headers:</span> <code>${headers ?? ""}</code></div>
              <div class="col-12 pt-2"><pre><code>${messagePayload ?? ""}</code></pre></div>
            </div>
          </div>
        </div>
    </div>
`;
      case "produceResponse":
        return `
    <div class="w-100 d-flex ${msgContainerClass}">
        <div class="row mx-4" style="width: 52%!important;">
          <div class="col-12 rounded-3 p-1 px-2 ${msgClass}">
            <div class="row no-gutters">
              <div class="col-12"><span class="text-muted">produce status:</span> ${messageText.status ?? "null"}</div>
              <div class="col-12 pt-2">${messageText.reason ?? ""}</div>
            </div>
          </div>
        </div>
    </div>
`;
    }
  }

  add(gatewayMessage, formatMessage=true) { //type: TopicMessage
    // if(formatMessage) {
    //   topicMessage.formatedMessageSizeBytes = this.formatMessageSize(topicMessage.messageSizeBytes);
    //   topicMessage.formattedPublishTime = this.formatPublishTime(topicMessage.publishTime);
    // }

    this._listJs.add(gatewayMessage);
    this.refreshInfo();
    this.filter();
  }

  refreshInfo(){
    // document.getElementById('messagesCount').innerText = this._listJs.items.length.toString();
    // document.getElementById('avgMessageSize').innerText = this.formatMessageSize(this._avgMessageSizeBytes);
  }

  formatMessageSize(messageSizeBytes){
    if(!messageSizeBytes){
      return '0';
    }

    if(messageSizeBytes > 1024){
      return (messageSizeBytes / 1024).toFixed(2) + ' KB';
    }else if(messageSizeBytes > 1024 * 1024){
      return (messageSizeBytes / 1024 / 1024).toFixed(2) + ' MB';
    }else if(messageSizeBytes > 1024 * 1024 * 1024){
      return (messageSizeBytes / 1024 / 1024 / 1024).toFixed(2) + ' GB';
    }

    return messageSizeBytes.toFixed(2)  + ' Bytes';
  }

  formatPublishTime(messagePublishTime){
    const pubTime = new Date(messagePublishTime);
    return pubTime.toISOString()
                  .replace('T', ' ')
                  .replace('Z', '');
  }

  showError(text) {
    document.getElementById('pageError').classList.remove('d-none');
    document.getElementById('pageError').innerText = text;
  }

  showInfo(text) {
    document.getElementById('pageMessage').classList.remove('d-none');
    document.getElementById('pageMessage').innerText = text;
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