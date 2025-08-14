const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder().setName('skip').setDescription('Salta la canción actual'),
  async execute(interaction, client) {
    const vc = interaction.member?.voice?.channel;
    if (!vc) return interaction.reply({ content: '🔇 Debes estar en un canal de voz.', ephemeral: true });

    const queue = client.distube.getQueue(interaction.guildId);
    if (!queue) return interaction.reply({ content: '📭 No hay nada reproduciéndose.', ephemeral: true });
    if (queue.voice?.channelId !== vc.id) {
      return interaction.reply({ content: '🚫 Debes estar en el mismo canal de voz que el bot.', ephemeral: true });
    }
    if (queue.songs.length <= 1) {
      return interaction.reply({ content: '⚠️ No hay más canciones para saltar.', ephemeral: true });
    }

    try {
      await queue.skip();
      await interaction.reply('⏭️ Canción saltada.');
    } catch (err) {
      console.error('Error en /skip:', err);
      await interaction.reply({ content: '❌ No pude saltar la canción.', ephemeral: true });
    }
  }
};
