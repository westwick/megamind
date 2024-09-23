class ConversationHandler {
  constructor(eventBus) {
    this.eventBus = eventBus;
    this.setupEventListeners();
  }

  setupEventListeners = () => {
    this.eventBus.on("new-message-line", this.handleMessage.bind(this));
    this.eventBus.on("new-message-batch", this.handleBatch.bind(this));
  };

  handleMessage = (event) => {
    this.checkForTelepath(event);
    this.checkForBroadcast(event);
    this.checkForGossipsAndAuctions(event);
    this.checkForGangpath(event);
  };

  handleBatch = (event) => {
    this.checkForPaging(event);
  };

  checkForTelepath = (event) => {
    if (event.message && event.message.spans) {
      for (let i = 0; i < event.message.spans.length - 1; i++) {
        const currentSpan = event.message.spans[i];
        const nextSpan = event.message.spans[i + 1];

        if (
          currentSpan.color &&
          currentSpan.color.name === "green" &&
          !currentSpan.color.bright &&
          nextSpan.color &&
          nextSpan.color.name === "lightGray" &&
          !nextSpan.color.bright
        ) {
          const telepathRegex = /(\w+) telepaths: (.*)$/;
          const match = currentSpan.text.match(telepathRegex);
          if (match) {
            const [, sender, partialMessage] = match;
            const fullMessage = (partialMessage + nextSpan.text).trim();
            this.eventBus.emit("conversation", {
              type: "telepath",
              sender,
              message: fullMessage,
            });
            console.log(
              `[conversationHandler] ${sender} telepaths: ${fullMessage}`
            );
            return; // Exit after finding a match
          }
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
          this.eventBus.emit("conversation", {
            type: "broadcast",
            sender: username,
            message: message,
          });
          console.log(
            `[conversationHandler] Broadcast from ${username}: ${message}`
          );
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
      const relevantSpans = event.message.spans.filter(
        (span) =>
          (span.color &&
            span.color.name === "lightGray" &&
            (span.text.includes("gossips:") ||
              span.text.includes("auctions:"))) ||
          (span.color && span.color.name === "magenta")
      );

      if (relevantSpans.length >= 2) {
        const cleanMessage = event.line.split("]:").pop().trim();
        const [senderPart, messagePart] = cleanMessage.split(
          /\s+(gossips|auctions):\s+/
        );

        if (senderPart && messagePart) {
          const username = senderPart.trim();
          const message = messagePart.trim();
          const type = cleanMessage.includes("gossips:") ? "gossip" : "auction";

          this.eventBus.emit("conversation", {
            type: type,
            sender: username,
            message: message,
          });
          console.log(
            `[conversationHandler] ${
              type.charAt(0).toUpperCase() + type.slice(1)
            } from ${username}: ${message}`
          );
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

      if (gangpathSpans.length >= 2) {
        const cleanMessage = event.line.split("]:").pop().trim();
        const [senderPart, messagePart] = cleanMessage.split(" gangpaths: ");

        if (senderPart && messagePart) {
          const username = senderPart.trim();
          const message = messagePart.trim();

          this.eventBus.emit("conversation", {
            type: "gangpath",
            sender: username,
            message: message,
          });
          console.log(
            `[conversationHandler] Gangpath from ${username}: ${message}`
          );
        }
      }
    }
  };

  checkForPaging = (event) => {
    if (event && event.messages && event.messages.length >= 2) {
      const firstMessage = event.messages[0];
      const secondMessage = event.messages[1];

      // Check for three bright yellow asterisks
      const hasYellowAsterisks = firstMessage.spans.some(
        (span) =>
          span &&
          span.text === "***" &&
          span.color &&
          span.color.name === "yellow" &&
          span.color.bright
      );

      if (hasYellowAsterisks) {
        // Check for the paging pattern in the second message
        const pagingPattern = /^(\u0007)?(\w+) is paging you from (\w+): (.+)$/;
        const secondMessageText = secondMessage.line;
        const match = secondMessageText.match(pagingPattern);

        if (match) {
          const [, , username, module, message] = match;
          this.eventBus.emit("conversation", {
            type: "page",
            sender: username,
            module: module,
            message: message,
          });
          console.log(
            `[conversationHandler] ${username} paged from ${module}: ${message}`
          );
        }
      }
    }
  };
}

export default ConversationHandler;
