const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('pause')
    .setDescription('Pausa la reproducción'),

  async execute(interaction, client) {
    const vc = interaction.member?.voice?.channel;
    if (!vc) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle('🔇 No estás en un canal de voz')
            .setDescription('Debes estar en un canal de voz para pausar la música.')
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
            .setDescription('Debes estar en el mismo canal de voz que el bot para pausar la música.')
            .setColor(0xff0000)
            .setTimestamp()
        ],
        ephemeral: true
      });
    }

    try {
      queue.pause();

      const song = queue.songs[0];
      const embed = new EmbedBuilder()
        .setTitle('⏸️ Música pausada')
        .setDescription(`[${song.name}](${song.url})`)
        .addFields(
          { name: '⏱ Duración', value: song.formattedDuration, inline: true },
          { name: '👤 Pedido por', value: song.user?.username || 'Desconocido', inline: true }
        )
        .setThumbnail(song.thumbnail || null)
        .setColor(0xf5c518)
        .setFooter({ text: `Pausado por ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() })
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    } catch (err) {
      console.error('❌ Error en /pause:', err);
      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle('❌ Error al pausar')
            .setDescription('No se pudo pausar la música. Revisá la consola.')
            .setColor(0xff0000)
            .setTimestamp()
        ],
        ephemeral: true
      });
    }
  }
};
