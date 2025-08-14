const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('Reproduce una canción desde texto o link')
    .addStringOption(option =>
      option.setName('query')
        .setDescription('Nombre de la canción o link de YouTube/Spotify/SoundCloud')
        .setRequired(true)
    ),

  async execute(interaction) {
    const query = interaction.options.getString('query');
    const voiceChannel = interaction.member.voice.channel;

    if (!voiceChannel) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle('❌ No estás en un canal de voz')
            .setDescription('Debes estar en un canal de voz para reproducir música.')
            .setColor(0xff5555)
            .setTimestamp()
        ],
        ephemeral: true
      });
    }

    const isLink = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be|soundcloud\.com|open\.spotify\.com)/.test(query);

    try {
      await interaction.deferReply();

      await interaction.client.distube.play(voiceChannel, query, {
        member: interaction.member,
        textChannel: interaction.channel,
        interaction,
      });

      // Esperar a que la canción se cargue
      setTimeout(() => {
        const queue = interaction.client.distube.getQueue(interaction.guildId);
        const song = queue?.songs[0];
        if (!song) {
          return interaction.editReply({
            embeds: [
              new EmbedBuilder()
                .setTitle('❌ No se pudo obtener la canción')
                .setDescription('La canción no se cargó correctamente.')
                .setColor(0xff0000)
                .setTimestamp()
            ]
          });
        }

        const embed = new EmbedBuilder()
          .setTitle('🎶 Reproduciendo')
          .setDescription(`[${song.name}](${song.url})`)
          .addFields(
            { name: '⏱ Duración', value: song.formattedDuration, inline: true },
            { name: '👤 Pedido por', value: song.user?.username || 'Desconocido', inline: true }
          )
          .setThumbnail(song.thumbnail || null)
          .setColor(0x00ff99)
          .setFooter({ text: `Pedido por ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() })
          .setTimestamp();

        interaction.editReply({ embeds: [embed] });
      }, 1500); // ⏳ Espera breve para que DisTube cargue la canción
    } catch (error) {
      console.error('❌ Error al reproducir:', error);
      interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setTitle('❌ Error al reproducir')
            .setDescription('No se pudo reproducir la canción. Verificá el link o el nombre.')
            .setColor(0xff0000)
            .setTimestamp()
        ]
      });
    }
  },
};
