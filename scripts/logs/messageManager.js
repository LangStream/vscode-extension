export default class MessageManager {
  _listJs = undefined;

  constructor() {
    const listOptions = {
      valueNames: [
        'timestamp',
        'level',
        'worker',
        'message',
        { name: 'logColor', attr: 'style'},
        { nane: 'workerColor', attr: 'style'}
      ],
      item: 'list-item',
      listClass: 'list',
      searchClass: 'search',
      searchColumns: [ 'message' ],
      searchDelay: 400
    };

    this._listJs = new List('messages-list', listOptions);
    this.filter();

    document.getElementById('search-message-payload').addEventListener('keyup', () => {
      this.search();
    });

    document.getElementsByName("publishDate").forEach((element) => {
      element.addEventListener('change', () => {
        this.filter();
      });
    });

    document.getElementsByName("logLevel").forEach((element) => {
      element.addEventListener('change', () => {
        this.filter();
      });
    });
  }

  clear(){
    this._listJs.clear();
  }

  add(gatewayMessage) {
    const color = {
      black: "\u001b[30m",
      red: "\u001b[31m",
      green: "\u001b[32m",
      yellow: "\u001b[33m",
      dodgerblue: "\u001b[34m",
      magenta: "\u001b[35m",
      cyan: "\u001b[36m",
      white: "\u001b[37m",
    };

    for(const key in color){
      if(!gatewayMessage.rawMessage.includes(color[key])){
        continue;
      }

      gatewayMessage.workerColor = `color: ${key}`;

      Object.keys(gatewayMessage).forEach((messageKey) => {
        gatewayMessage[messageKey] = gatewayMessage[messageKey].replace(color[key], '').replace("\u001b", '').replace("[0m", '').replace('32m[','');
      });
    }

    if(gatewayMessage.message === 'undefined' || gatewayMessage.message === 'null' || gatewayMessage.message.length === 0){
      gatewayMessage.message = gatewayMessage.rawMessage;
    }

    gatewayMessage.logColor = 'color: grey';

    switch(gatewayMessage.level?.toLowerCase()){
      case 'error':
        gatewayMessage.logColor = 'color: red';
        break;
      case 'warn':
        gatewayMessage.logColor = 'color: yellow';
        break;
      case 'info':
        gatewayMessage.logColor = 'color: dodgerblue';
        break;
      case 'debug':
        gatewayMessage.logColor = 'color: green';
        break;
    }

    //console.log(gatewayMessage);

    this._listJs.add(gatewayMessage);
    this.filter();
  }

  search(){
    // console.log("MessageManager search");
    setTimeout(() => {
      this._listJs.search(document.getElementById('search-message-payload').value, ['message']);
    },400);
  }

  filter(){
    let logLevelFilter = undefined;
    document.getElementsByName('logLevel').forEach((item) => {
      if(!item.checked || item.value === 'all') {
        return;
      }

      logLevelFilter = item.value;
    });

    this._listJs.filter((item) => {
      return (!logLevelFilter || item.values().level.toLowerCase() === logLevelFilter.toLowerCase());
    });
  }

  get messages(){
    return this._listJs.items;
  }
}