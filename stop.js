const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('stop')
    .setDescription('Detiene la música y limpia la cola'),

  async execute(interaction, client) {
    const vc = interaction.member?.voice?.channel;

    if (!vc) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle('🔇 No estás en un canal de voz')
            .setDescription('Debes estar en un canal de voz para detener la música.')
            .setColor(0xff5555)
            .setTimestamp()
        ],
        ephemeral: true
      });
    }

    const queue = client.distube.getQueue(interaction.guildId);
    if (!queue) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle('📭 Nada está sonando')
            .setDescription('No hay ninguna canción reproduciéndose.')
            .setColor(0xffaa00)
            .setTimestamp()
        ],
        ephemeral: true
      });
    }

    if (queue.voice?.channelId !== vc.id) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle('🚫 Canal de voz incorrecto')
            .setDescription('Debes estar en el mismo canal de voz que el bot para detener la música.')
            .setColor(0xff0000)
            .setTimestamp()
        ],
        ephemeral: true
      });
    }

    try {
      const song = queue.songs[0];
      const total = queue.songs.length;

      queue.stop();

      const embed = new EmbedBuilder()
        .setTitle('🛑 Música detenida')
        .setDescription(`Se detuvo la reproducción y se eliminó la cola.`)
        .addFields(
          { name: '🎶 Última canción', value: `[${song.name}](${song.url})`, inline: false },
          { name: '⏱ Duración', value: song.formattedDuration, inline: true },
          { name: '📦 Canciones eliminadas', value: `${total}`, inline: true }
        )
        .setThumbnail(song.thumbnail || null)
        .setColor(0xe74c3c)
        .setFooter({ text: `Detenido por ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() })
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    } catch (err) {
      console.error('❌ Error en /stop:', err);
      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle('❌ Error al detener')
            .setDescription('No se pudo detener la música. Revisá la consola.')
            .setColor(0xff0000)
            .setTimestamp()
        ],
        ephemeral: true
      });
    }
  }
};
