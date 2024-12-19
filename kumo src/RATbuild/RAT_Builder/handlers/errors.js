import { EmbedBuilder } from "discord.js";

export default (client) => {
  // Create and return an error embed
  client.getErrorEmbed = () => {
    return new EmbedBuilder().setColor("Red").setTitle("❌ Error");
  };

  // Log error and send it to a specific logs channel
  client.logError = async (error) => {
    try {
      console.error("Logging error:", error);
      const channel = await client.channels.fetch(client.config.logs);
      const embed = new EmbedBuilder().setColor("Red").setTitle("❌ Error").setDescription(`\`\`\`${error}\`\`\``);
      await channel.send({ embeds: [embed] });
      console.log("Error logged to channel.");
    } catch (err) {
      console.error("Failed to log error:", err);
    }
  };

  // Send an error embed to the interaction
  client.sendErrorEmbed = async (interaction, error, type) => {
    try {
      console.log("Sending error embed to interaction:", error);
      const embed = client.getErrorEmbed().setDescription(`${error}`);

      if (interaction.replied || interaction.deferred) {
        console.log("Interaction already replied or deferred, using followUp.");
        return await interaction.followUp({
          embeds: [embed],
          ephemeral: true,
        });
      } else {
        if (type == client.EDIT_REPLY) {
          console.log("Editing reply with error embed.");
          return await interaction.editReply({
            embeds: [embed],
          });
        } else {
          console.log("Replying with error embed.");
          return await interaction.reply({
            embeds: [embed],
            ephemeral: true,
          });
        }
      }
    } catch (err) {
      console.error("Failed to send error embed:", err);
    }
  };

  return true;
};
