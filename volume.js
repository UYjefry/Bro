const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('volume')
    .setDescription('Ajusta el volumen (0-100)')
    .addIntegerOption(o =>
      o.setName('nivel').setDescription('Volumen (0-100)').setRequired(true)
    ),

  async execute(interaction, client) {
    const nivel = interaction.options.getInteger('nivel');
    const vc = interaction.member?.voice?.channel;

    if (!vc) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle('🔇 No estás en un canal de voz')
            .setDescription('Debes estar en un canal de voz para ajustar el volumen.')
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
            .setDescription('Debes estar en el mismo canal de voz que el bot para ajustar el volumen.')
            .setColor(0xff0000)
            .setTimestamp()
        ],
        ephemeral: true
      });
    }

    if (nivel < 0 || nivel > 100) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle('⚠️ Volumen inválido')
            .setDescription('El volumen debe estar entre **0 y 100**.')
            .setColor(0xffff00)
            .setTimestamp()
        ],
        ephemeral: true
      });
    }

    try {
      queue.setVolume(nivel);
      const song = queue.songs[0];

      const embed = new EmbedBuilder()
        .setTitle('🔊 Volumen ajustado')
        .setDescription(`Volumen establecido en **${nivel}%**`)
        .addFields(
          { name: '🎶 Canción actual', value: `[${song.name}](${song.url})`, inline: false },
          { name: '⏱ Duración', value: song.formattedDuration, inline: true },
          { name: '👤 Pedido por', value: song.user?.username || 'Desconocido', inline: true }
        )
        .setThumbnail(song.thumbnail || null)
        .setColor(0x1abc9c)
        .setFooter({ text: `Ajustado por ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() })
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    } catch (err) {
      console.error('❌ Error en /volume:', err);
      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle('❌ Error al ajustar volumen')
            .setDescription('No se pudo cambiar el volumen. Revisá la consola.')
            .setColor(0xff0000)
            .setTimestamp()
        ],
        ephemeral: true
      });
    }
  }
};
