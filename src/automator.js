class MUDAutomator {
    constructor(telnetSocket) {
      this.telnetSocket = telnetSocket;
      this.loginInfo = {
        username: 'megamind',
        password: 'tester1'
      };
    }
  
    parse(data) {
      const text = data.toString()
      const lines = text.split('\n');
      const lastLine = this.stripAnsi(lines[lines.length - 1]).trim();
      console.log(lastLine);
  
      if (lastLine.includes('Otherwise type "new":')) {
        this.sendCommand(this.loginInfo.username);
      }
      
      if (text.includes('Enter your password:')) {
        this.sendCommand(this.loginInfo.password);
      }

      if(lastLine.includes('(N)onstop, (Q)uit, or (C)ontinue?')) {
        this.sendCommand('n');
      }
  
      // Add more parsing logic here for other automated responses
    }

    stripAnsi(str) {
      return str.replace(/\x1B\[[0-9;]*[JKmsu]/g, '');
    }
  
    sendCommand(command) {
      this.telnetSocket.write(Buffer.from(command + '\r', 'utf8'));
    }
  }
  
  module.exports = MUDAutomator;