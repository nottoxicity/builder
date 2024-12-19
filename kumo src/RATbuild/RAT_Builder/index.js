import { Client, GatewayIntentBits } from "discord.js";
import { token } from "./config.js";

import commandHandler from "./handlers/commands.js";
import eventHandler from "./handlers/events.js";
import errorHandler from "./handlers/errors.js";

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
client.db = import("./database.js");
client.config = import("./config.js");
client.skyhelper = import("../SkyHelper/index.js");
client.isBuilding = false;
client.isInjecting = false;
client.isPumping = false;
client.TIER_0 = "tier_0";
client.TIER_1 = "tier_1";
client.TIER_2 = "tier_2";
client.TIER_3 = "tier_3";
client.EDIT_REPLY = "edit_reply";

async function start() {
  try {
    console.log("Initializing bot...");

    // Wait for modules to load
    console.log("Loading database...");
    client.db = await client.db;
    console.log("Database loaded successfully.");

    console.log("Loading configuration...");
    client.config = await client.config;
    console.log("Configuration loaded successfully.");

    console.log("Loading SkyHelper...");
    client.skyhelper = await client.skyhelper;
    console.log("SkyHelper loaded successfully.");

    // Initialize database tables and SkyHelper
    console.log("Creating database tables...");
    client.db.createTables();
    console.log("Database tables created.");

    console.log("Initializing SkyHelper...");
    client.skyhelper.init();
    console.log("SkyHelper initialized.");

    // Handle commands, events, and errors
    console.log("Setting up command handler...");
    await commandHandler(client);
    console.log("Command handler set up.");

    console.log("Setting up event handler...");
    await eventHandler(client);
    console.log("Event handler set up.");

    console.log("Setting up error handler...");
    await errorHandler(client);
    console.log("Error handler set up.");

    // Log in to Discord
    console.log("Logging in to Discord...");
    await client.login(token);
    console.log("Bot logged in successfully.");
  } catch (error) {
    console.error("An error occurred during bot startup:", error);
  }
}

start();
