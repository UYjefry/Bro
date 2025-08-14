const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('queue')
    .setDescription('Muestra la cola de reproducción actual'),

  async execute(interaction, client) {
    const queue = client.distube.getQueue(interaction.guildId);

    if (!queue || !queue.songs.length) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle('📭 Cola vacía')
            .setDescription('No hay canciones en la cola actualmente.')
            .setColor(0xff5555)
            .setTimestamp()
        ],
        ephemeral: true
      });
    }

    const nowPlaying = queue.songs[0];
    const upcoming = queue.songs.slice(1, 15); // Mostrar siguientes 14

    let description = `▶️ [${nowPlaying.name}](${nowPlaying.url}) \`(${nowPlaying.formattedDuration})\`\n`;
    description += `👤 Pedido por: ${nowPlaying.user?.username || 'Desconocido'}\n\n`;

    if (upcoming.length) {
      description += '**🎶 Próximas canciones:**\n';
      description += upcoming
        .map((song, i) => `${i + 1}. [${song.name}](${song.url}) \`(${song.formattedDuration})\``)
        .join('\n');
    } else {
      description += '📜 No hay más canciones en la cola.';
    }

    if (queue.songs.length > 15) {
      description += `\n\n...y ${queue.songs.length - 15} canción(es) más.`;
    }

    const embed = new EmbedBuilder()
      .setTitle('📀 Cola de reproducción')
      .setDescription(description)
      .setThumbnail(nowPlaying.thumbnail || null)
      .setColor(0x7289da)
      .setFooter({ text: `Total: ${queue.songs.length} canción(es)`, iconURL: interaction.user.displayAvatarURL() })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
};
