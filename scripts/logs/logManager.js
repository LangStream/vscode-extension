class MessageManager {
  _listJs = undefined;

  constructor() {
    //console.log("MessageManager constructor");
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

  clear(){
    this._listJs.clear();
    this.refreshInfo();
  }

  formatListItem(logMessage){
    let text = logMessage.text;

    const color = {};
    color.black ="\x1b[30m";
    color.red = "\x1b[31m";
    color.green = "\x1b[32m";
    color.yellow = "\x1b[33m";
    color.blue = "\x1b[34m";
    color.magenta = "\x1b[35m";
    color.cyan = "\x1b[36m";
    color.white = "\x1b[37m";

    for(const key in color){
      text = text.replace(color[key], `<span style="color: ${key};">`).replace("\x1b[0m", "</span>");
    }

    //\x1B[32mlang-detect-pipelinelanguage-detector1-0 18:0…r clientId=producer-1] Node -1 disconnected.\x1B[0m\n

    return `
    <div class="text-wrap">
        ${text}
    </div>
`;
  }

  add(gatewayMessage) { //type: TopicMessage
    this._listJs.add(gatewayMessage);
    this.refreshInfo();
    this.filter();
  }

  refreshInfo(){
    // document.getElementById('messagesCount').innerText = this._listJs.items.length.toString();
    // document.getElementById('avgMessageSize').innerText = this.formatMessageSize(this._avgMessageSizeBytes);
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