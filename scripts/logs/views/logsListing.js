export default class LogListingView {
  messenger;

  constructor(messenger) {
    this.messenger = messenger;
  }

  initialize() {
    document.getElementById("retry-messages-link").addEventListener('click', event => {
      this.reconnectSocket();
    });

    document.getElementById("close-socket-link").addEventListener('click', event => {
      this.closeSocket();
    });
  }

  reconnectSocket(){
    this.messenger.sendMessage('ready');
  }

  closeSocket(){
    this.messenger.sendMessage('connection', 'close');
  }
}