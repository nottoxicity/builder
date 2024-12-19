import { Collection } from "discord.js";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ascii from "ascii-table";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const table = new ascii().setHeading("Event", "Load Status");

export default async (client) => {
  console.log("Loading events...");

  client.events = new Collection();
  const eventsPath = path.join(__dirname, "/../events");

  try {
    const eventsFiles = fs.readdirSync(eventsPath).filter((file) => file.endsWith(".js"));
    console.log(`Found ${eventsFiles.length} event(s) to load.`);

    for (const file of eventsFiles) {
      const filePath = path.join(eventsPath, file);

      try {
        console.log(`Loading event: ${file}`);
        const event = await import(filePath);

        if ("name" in event && "execute" in event) {
          if (event.once) {
            client.once(event.name, (...args) => event.execute(client, ...args));
          } else {
            client.on(event.name, (...args) => event.execute(client, ...args));
          }
          table.addRow(file, "✅");
        } else {
          table.addRow(file, "❌ -> missing 'name' or 'execute'!");
          console.error(`Error in ${file}: Missing 'name' or 'execute' properties.`);
        }
      } catch (eventError) {
        table.addRow(file, "❌ -> failed to load");
        console.error(`Error loading event ${file}:`, eventError);
      }
    }
  } catch (fsError) {
    console.error("Error reading events directory:", fsError);
  }

  console.log(table.toString());
  console.log("Event loading completed.");

  return true;
};
