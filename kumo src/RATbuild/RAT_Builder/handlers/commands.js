import { Collection } from "discord.js";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ascii from "ascii-table";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const table = new ascii().setHeading("Command", "Load Status");

export default async (client) => {
  console.log("Loading commands...");

  client.commands = new Collection();
  client.cooldowns = new Collection();
  const commandsPath = path.join(__dirname, "../commands");

  try {
    const commandFiles = fs.readdirSync(commandsPath).filter((file) => file.endsWith(".js"));
    console.log(`Found ${commandFiles.length} command(s) to load.`);

    for (const file of commandFiles) {
      const filePath = path.join(commandsPath, file);
      try {
        console.log(`Loading command: ${file}`);
        const command = await import(filePath);

        if ("data" in command && "execute" in command) {
          client.commands.set(command.data.name, command);
          client.cooldowns.set(command.data.name, new Collection());
          table.addRow(file, "✅");
        } else {
          table.addRow(file, "❌ -> missing 'data' or 'execute'!");
          console.error(`Error in ${file}: Missing 'data' or 'execute' properties.`);
        }
      } catch (commandError) {
        table.addRow(file, "❌ -> failed to load");
        console.error(`Error loading command ${file}:`, commandError);
      }
    }
  } catch (fsError) {
    console.error("Error reading commands directory:", fsError);
  }

  console.log(table.toString());
  console.log("Command loading completed.");

  return true;
};
