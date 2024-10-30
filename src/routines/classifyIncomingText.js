function classifyLine(line, msg, timestamp) {
  // regex patterns for classification
  const conversationPatterns = {
    telepath: /(\w+) telepaths:(.*)$/,
    broadcast: /^Broadcast from (\w+) "(.+)"$/,
    gangpath: /^(\w+) gangpaths:(.*)$/,
    gossip: /^(\w+)\s+(gossips):(.+)$/,
    auction: /^(\w+)\s+(auctions):(.+)$/,
    local: /^(\w+) says "(.*)"$/,
    "local-self": /^You say "(.*)"$/,
    "local-directed": /^(\w+) says \(to (\w+)\) "(.*)"$/,
    page: /^(\u0007)?(\w+) is paging you from (\w+): (.+)$/, // TODO: how does this \u0007 exist inside lines?
    realm_enter: /^(\w+) just entered the Realm\.$/,
    realm_leave: /^(\w+) just left the Realm\.$/,
    realm_disconnect: /^(\w+) just (disconnected!!!|hung up!!!)$/,
  };

  // Check the line against each pattern
  for (const [label, pattern] of Object.entries(patterns)) {
    const match = pattern.match(line);
    if (match) {
      return { label, match };
    }
  }

  // Return the classification result
  return { label: "unknown-line" };
}

function classifyBatch(lines, messages) {
  return "batch-unknown";
}

// Export the function if needed
module.exports = { classifyLine, classifyBatch };
