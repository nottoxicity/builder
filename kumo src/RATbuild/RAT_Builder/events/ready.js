import { Events, ActivityType, EmbedBuilder } from "discord.js";
import fetch from "node-fetch";

const staffBanLast15Mins = [];

export const name = Events.ClientReady;
export const once = true;
export async function execute(client, event) {
  // Set bot activity status on startup
  await setActivity(client);
  // Keep the activity status updated every hour
  setInterval(() => setActivity(client), 3600000);

  // Setup the ban wave detector
  await setupBanWaveDetector(client);

  // Log when the bot is ready
  console.log(`[RAT Builder] ${event.user.tag} is ready to build some RATs!`);
}

// Set the bot's activity status
const setActivity = async (client) => {
  client.user.setPresence({
    activities: [{ name: `/build | by @probablynottoxicity`, type: ActivityType.Playing }],
    status: "online",
  });
};

// Setup the Ban Wave Detector by clearing old messages and starting the check
const setupBanWaveDetector = async (client) => {
  const channel = await client.channels.fetch(client.config.banWaveDetector);
  await channel.bulkDelete(50);  // Delete old messages to avoid clutter

  const msg = await checkBans(client, channel, null, true);
  setInterval(checkBans, 60000, client, channel, msg);  // Check every minute
};

// Calculate the difference in staff bans over time
const getBanDiff = async () => {
  return staffBanLast15Mins.length > 1
      ? Math.abs(staffBanLast15Mins[staffBanLast15Mins.length - 1] - staffBanLast15Mins[0])
      : 0;
};

// Calculate the number of entries in the ban data array
const getBanTimeDiff = async () => {
  return staffBanLast15Mins.length > 1 ? staffBanLast15Mins.length - 1 : 0;
};

// Check the number of bans and generate an appropriate message
const checkBans = async (client, channel, msg, send) => {
  return new Promise(async (resolve, reject) => {
    try {
      const response = await fetch("https://api.plancke.io/hypixel/v1/punishmentStats");
      const data = await response.json();

      // Track ban counts over time
      staffBanLast15Mins.push(data.record.staff_total);
      if (staffBanLast15Mins.length == 17) staffBanLast15Mins.shift();  // Keep array size fixed at 15

      const banTimeDiff = await getBanTimeDiff();
      const banDiff = await getBanDiff();

      // Build the embed to report the ban wave status
      const embed = new EmbedBuilder().setTitle("Ban Wave Detector").setTimestamp();

      // If a significant ban wave is detected, set to Red
      if (banDiff / banTimeDiff >= 30 / 15) {
        embed.setColor("Red");
        embed.addFields(
            { name: "❗ Status ❗", value: "Ban-Wave detected", inline: false },
            { name: "🔨 Banned Count", value: `${await getBanDiff()} players have been banned in the past ${await getBanTimeDiff()} minutes`, inline: false }
        );
      }
      // If a moderate ban wave is detected, set to Yellow
      else if (banDiff / banTimeDiff >= 15 / 15) {
        embed.setColor("Yellow");
        embed.addFields(
            { name: "⚠️ Status ⚠️", value: "Be Careful", inline: false },
            { name: "🔨 Banned Count", value: `${await getBanDiff()} players have been banned in the past ${await getBanTimeDiff()} minutes`, inline: false }
        );
      }
      // If no ban wave detected, set to Green
      else {
        embed.setColor("Green");
        embed.addFields(
            { name: "✅ Status ✅", value: "No Ban-Wave detected", inline: false },
            { name: "🔨 Banned Count", value: `${await getBanDiff()} players have been banned in the past ${await getBanTimeDiff()} minutes`, inline: false }
        );
      }

      // Send the embed as a message in the channel
      if (send) {
        const message = await channel.send({ embeds: [embed] });
        return resolve(message);
      } else if (msg) {
        await msg.edit({ embeds: [embed] });
        return resolve();
      }
    } catch (e) {
      client.logError(e);  // Log any errors
      return resolve();
    }
  });
};
