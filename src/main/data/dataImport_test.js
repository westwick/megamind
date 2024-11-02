import path from "path";
import readJsonLinesFile from "./dataImport.js";

async function main() {
  try {
    const filePath = path.join(
      __dirname,
      "..",
      "..",
      "data",
      "monsters-v1.11p.json.gz"
    );
    const jsonData = await readJsonLinesFile(filePath);
    console.log(`Successfully parsed ${jsonData.length} JSON lines from file.`);
    // Process jsonData as needed
    console.log(jsonData[0]);
  } catch (error) {
    console.error("Error processing JSON file:", error);
  }
}

main();
