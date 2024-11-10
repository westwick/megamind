import Handler from './Handler.js';

class ConversationHandler extends Handler {
  constructor(...args) {
    super(...args);

    this.setupEventListeners();
  }

  setupEventListeners = () => {
    this.eventBus.on("new-message-line", this.handleMessage.bind(this));
  };

  handleMessage = (event) => {
    this.checkForTelepath(event);
    this.checkForBroadcast(event);
    this.checkForGossipsAndAuctions(event);
    this.checkForGangpath(event);
    this.checkForPaging(event);
    this.checkForLocalMessage(event);
    this.checkForRealmActivity(event); // Add this line
  };

  emitConversationEvent(eventData) {
    this.eventBus.emit("conversation", {
      ...eventData,
      timestamp: new Date().toISOString(),
    });
  }

  checkForTelepath = (event) => {
    if (
      event.message &&
      event.message.spans &&
      event.message.spans.length === 2
    ) {
      const currentSpan = event.message.spans[0];
      const nextSpan = event.message.spans[1];

      if (
        currentSpan.color &&
        currentSpan.color.name === "green" &&
        !currentSpan.color.bright &&
        nextSpan.color &&
        nextSpan.color.name === "lightGray" &&
        !nextSpan.color.bright
      ) {
        const telepathRegex = /(\w+) telepaths:(.*)$/;
        const match = currentSpan.text.match(telepathRegex);
        if (match) {
          const [, sender, partialMessage] = match;
          const fullMessage = (partialMessage + nextSpan.text).trim();
          this.emitConversationEvent({
            type: "telepath",
            sender,
            message: fullMessage,
          });
        }
      }
    }
  };

  checkForBroadcast = (event) => {
    if (
      event.message &&
      event.message.spans &&
      event.message.spans.length > 0
    ) {
      const isBrightYellow = event.message.spans.some(
        (span) =>
          span.color &&
          span.color.name === "yellow" &&
          span.color.bright &&
          span.text.startsWith("Broadcast from")
      );

      if (isBrightYellow) {
        const fullMessage = event.line;
        const broadcastPattern = /Broadcast from (\w+) "(.+)"$/;
        const match = fullMessage.match(broadcastPattern);

        if (match) {
          const [, username, message] = match;
          this.emitConversationEvent({
            type: "broadcast",
            sender: username,
            message: message,
          });
        }
      }
    }
  };

  checkForGossipsAndAuctions = (event) => {
    if (
      event.message &&
      event.message.spans &&
      event.message.spans.length > 0
    ) {
      if (
        (event.message.spans[0].text.includes("gossips:") ||
          event.message.spans[0].text.includes("auctions:")) &&
        event.message.spans[1].color.name === "magenta"
      ) {
        const cleanMessage = event.line;
        const match = cleanMessage.match(/^(\w+)\s+(gossips|auctions):(.+)$/);

        if (match) {
          const [, username, type, message] = match;

          this.emitConversationEvent({
            type: type === "gossips" ? "gossip" : "auction",
            sender: username,
            message: message.trim(),
          });
        }
      }
    }
  };

  checkForGangpath = (event) => {
    if (
      event.message &&
      event.message.spans &&
      event.message.spans.length > 0
    ) {
      const gangpathSpans = event.message.spans.filter(
        (span) =>
          (span.color &&
            span.color.name === "green" &&
            !span.color.bright &&
            span.text.includes("gangpaths:")) ||
          (span.color && span.color.name === "yellow" && !span.color.bright)
      );

      if (gangpathSpans.length === 2) {
        const [senderPart, messagePart] = event.line.split(" gangpaths: ");

        if (senderPart && messagePart) {
          const username = senderPart.trim();
          const message = messagePart.trim();

          this.emitConversationEvent({
            type: "gangpath",
            sender: username,
            message: message,
          });
        }
      }
    }
  };

  checkForPaging = (event) => {
    if (event && event.line) {
      const pagingPattern = /^(\u0007)?(\w+) is paging you from (\w+): (.+)$/;
      const match = event.line.match(pagingPattern);

      if (match) {
        const [, , username, module, message] = match;
        this.emitConversationEvent({
          type: "page",
          sender: username,
          module: module,
          message: message,
        });
      }
    }
  };

  checkForLocalMessage = (event) => {
    if (event.message && event.message.spans) {
      const isDarkGreen = event.message.spans.some(
        (span) =>
          span.color && span.color.name === "green" && !span.color.bright
      );

      if (isDarkGreen) {
        let fullMessage = event.line;
        // Strip out the status line if present
        const statusLineIndex = fullMessage.indexOf("]:");
        if (statusLineIndex !== -1) {
          fullMessage = fullMessage.substring(statusLineIndex + 2).trim();
        }

        const localPatterns = [
          /^(\w+) says "(.*)"$/,
          /^You say "(.*)"$/,
          /^(\w+) says \(to (\w+)\) "(.*)"$/,
        ];

        for (const pattern of localPatterns) {
          const match = fullMessage.match(pattern);
          if (match) {
            let sender, recipient, message;
            if (match[0].startsWith("You say")) {
              sender = "You";
              message = match[1];
            } else if (match.length === 3) {
              [, sender, message] = match;
            } else if (match.length === 4) {
              [, sender, recipient, message] = match;
            }

            this.emitConversationEvent({
              type: "local",
              sender,
              recipient: recipient || undefined,
              message,
            });
            return;
          }
        }
      }
    }
  };

  checkForRealmActivity = (event) => {
    if (
      event.message &&
      event.message.spans &&
      event.message.spans.length === 1
    ) {
      let fullMessage = event.line;

      const span = event.message.spans[0];

      const enterLeavePattern = /^(\w+) just (entered|left) the Realm\.$/;
      const disconnectPattern = /^(\w+) just (disconnected!!!|hung up!!!)$/;

      let match = fullMessage.match(enterLeavePattern);
      if (match) {
        const [, username, action] = match;
        this.emitConversationEvent({
          type: action === "entered" ? "realm_enter" : "realm_leave",
          username: username,
        });
        return;
      }

      if (span.color && span.color.bright) {
        match = fullMessage.match(disconnectPattern);
        if (match) {
          const [, username, action] = match;
          this.emitConversationEvent({
            type: "realm_disconnect",
            username: username,
            action: action === "disconnected!!!" ? "disconnected" : "hung_up",
          });
          return;
        }
      }
    }
  };
}

export default ConversationHandler;
