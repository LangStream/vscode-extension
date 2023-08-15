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

  formatListItem(gatewayMessage){
    let msgContainerClass = 'justify-content-end';
    let label =   `to: ${gatewayMessage.gatewayId}`;
    let msgClass = 'text-light bg-primary text-end';
    let labelClass = 'text-end';

    if(gatewayMessage.command === "gatewayMessage"){
      msgContainerClass = 'justify-content-start';
      label = `from: ${gatewayMessage.gatewayId}`;
      msgClass = 'text-dark bg-light text-start';
      labelClass = 'text-start';
    }

    let messageText = gatewayMessage.text;
    if(typeof messageText === 'object'){
      messageText = JSON.stringify(gatewayMessage.text);

      if(messageText === {}){
        return;
      }
    }

    return `
    <div class="w-100 d-flex ${msgContainerClass}">
        <div class="row mx-4" style="width: 40%!important;">
            <div class="col-12 rounded-3 p-3 ${msgClass}">${messageText}</div>
            <div class="col-12 text-muted ${labelClass}">${label}</div>
        </div>
    </div>
`;
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