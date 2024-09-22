const LineDelimitedJsonGzReader = require("./monsters");
const path = require("path");

async function main() {
  const filePath = path.join(
    __dirname,
    "..",
    "..",
    "data",
    "monsters-v1.11p.json.gz"
  );
  const reader = new LineDelimitedJsonGzReader(filePath);

  console.log("Reading file:", filePath);

  // Read and print the first 5 items
  console.log("\nFirst 5 items:");
  let count = 0;
  for await (const item of reader.readLines()) {
    console.log(item);
    if (++count >= 5) break;
  }

  // Count total number of items
  console.log("\nCounting total items...");
  const allItems = await reader.readAll();
  console.log("Total items:", allItems.length);
}

main().catch(console.error);
