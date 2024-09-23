class RealmHandler {
  constructor(eventBus) {
    this.eventBus = eventBus;

    this.eventBus.on("new-message-batch", async (batch) => {
      this.handleWhoCommand(batch.lines, batch.messages);
    });
  }

  handleWhoCommand(lines, messages) {
    // "=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-="
    // if the lines contain the previous, then we can assume that the next lines are the users in the realm
    // in technical style
    if (
      lines.includes(
        "=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-="
      )
    ) {
      const userLines = lines.slice(
        lines.indexOf(
          "=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-="
        ) + 1
      );
      const onlineUsers = userLines
        .map((line) => {
          // given a line like this:
          // test = "Cutthroat       Throne Mithril         Neutral    None                      "
          // we want to get:
          // title = "Cutthroat"
          // name = "Throne Mithril"
          // align = "Neutral"
          // gang = "None"

          const playerParts = line.split("  ");
          const actualParts = playerParts.filter((part) => part.trim() !== "");
          const title = actualParts[0];
          const nameParts = actualParts[1].trim().split(" ");
          const firstName = nameParts[0];
          const lastName = nameParts[1];
          const align = actualParts[2];
          const gang = actualParts[3];

          return {
            title: title,
            firstName: firstName,
            lastName: lastName,
            align: align,
            gang: gang,
          };
        })
        .filter(Boolean); // Remove any null values
      this.eventBus.emit("update-online-users", onlineUsers);
      console.log("[realmHandler] Updated online users:", onlineUsers);
    }
  }
}
/* 
  handleWhoCommand(message) {
    if (
      message.includes(
        "[1;30m=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-="
      )
    ) {
      const lines = message.split("\n");
      const userLines = lines.slice(1, -1); // Remove the first and last lines (separators)

      const onlineUsers = userLines
        .map((line) => {
          const match = line.match(/\[32m([^\s]+)/);
          return match ? match[1] : null;
        })
        .filter(Boolean); // Remove any null values

      gameState.updateOnlineUsers(onlineUsers);
      console.log("Updated online users:", onlineUsers);

      // Notify the event bus about the updated online users
      this.eventBus.emit("update-online-users", onlineUsers);
    }
  }
    */
module.exports = RealmHandler;
