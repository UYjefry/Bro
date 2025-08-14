const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('np')
    .setDescription('Muestra la canción que se está reproduciendo'),

  async execute(interaction, client) {
    const queue = client.distube.getQueue(interaction.guildId);
    if (!queue || !queue.songs?.length) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle('🎶 Nada está sonando')
            .setDescription('No hay ninguna canción reproduciéndose en este momento.')
            .setColor(0xff5555)
            .setTimestamp()
        ],
        ephemeral: true
      });
    }

    const song = queue.songs[0];

    const embed = new EmbedBuilder()
      .setTitle('🎶 Ahora suena')
      .setDescription(`[${song.name}](${song.url})`)
      .addFields(
        { name: '⏱ Duración', value: song.formattedDuration, inline: true },
        { name: '👤 Pedido por', value: song.user?.username || 'Desconocido', inline: true }
      )
      .setThumbnail(song.thumbnail || null)
      .setColor(0x00bfff)
      .setTimestamp();

    return interaction.reply({ embeds: [embed] });
  }
};
