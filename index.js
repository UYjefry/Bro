require('dotenv').config();
const { Client, GatewayIntentBits, Collection, REST, Routes, EmbedBuilder } = require('discord.js');
const { DisTube } = require('distube');
const { SoundCloudPlugin } = require('@distube/soundcloud');
const { YtDlpPlugin } = require('@distube/yt-dlp');
const { YouTubePlugin } = require('@distube/youtube');
const { readdirSync } = require('fs');
const { join } = require('path');
const util = require('util');

// 🧠 Crear cliente
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates,
  ],
});

client.prefix = process.env.PREFIX || '!';
client.commands = new Collection();
client.slashCommands = new Collection();
client.canalPredeterminado = new Map(); // guildId → voiceChannelId

// 🎶 Inicializar DisTube con plugins
client.distube = new DisTube(client, {
  emitNewSongOnly: true,
  plugins: [
    new SoundCloudPlugin(),
    new YouTubePlugin(),
    new YtDlpPlugin({ update: true })
  ]
});

// 📂 Cargar comandos prefix
const prefixPath = join(__dirname, 'commands/prefix');
for (const file of readdirSync(prefixPath).filter(f => f.endsWith('.js'))) {
  const command = require(join(prefixPath, file));
  if (command.name && typeof command.execute === 'function') {
    client.commands.set(command.name, command);
  } else {
    console.warn(`⚠️ Comando prefix inválido: ${file}`);
  }
}

// 📂 Cargar comandos slash
const slashPath = join(__dirname, 'commands/slash');
const slashCommandsArray = [];
for (const file of readdirSync(slashPath).filter(f => f.endsWith('.js'))) {
  const command = require(join(slashPath, file));
  if (command.data?.name && typeof command.execute === 'function') {
    client.slashCommands.set(command.data.name, command);
    slashCommandsArray.push(command.data.toJSON());
  } else {
    console.warn(`⚠️ Comando slash inválido: ${file}`);
  }
}

// 🚀 Evento ready
client.once('ready', async () => {
  console.log(`✅ Conectado como ${client.user.tag}`);
  client.user.setActivity(`${client.prefix}help`, { type: 3 });

  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
  try {
    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: slashCommandsArray }
    );
    console.log('📡 Comandos slash registrados correctamente.');
  } catch (err) {
    console.error('❌ Error al registrar comandos slash:', err);
  }

  // 🔗 Mostrar link de invitación
  const inviteLink = `https://discord.com/oauth2/authorize?client_id=${process.env.CLIENT_ID}&permissions=274877990912&scope=bot%20applications.commands`;
  console.log(`🔗 Invitá el bot con este link:\n${inviteLink}`);
});

// 📩 Ejecutar comandos prefix
client.on('messageCreate', async message => {
  if (message.author.bot || !message.content.startsWith(client.prefix)) return;
  const args = message.content.slice(client.prefix.length).trim().split(/ +/);
  const cmdName = args.shift().toLowerCase();
  const command = client.commands.get(cmdName);
  if (!command) return;

  try {
    await command.execute(message, args, client);
  } catch (err) {
    console.error(`❌ Error en comando prefix "${cmdName}":`, err);
    message.reply('❌ Error al ejecutar el comando.');
  }
});

// ⚡ Ejecutar comandos slash
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;
  const command = client.slashCommands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction, client);
  } catch (err) {
    console.error(`❌ Error en comando slash "${interaction.commandName}":`, err);
    const errorReply = { content: '❌ Error al ejecutar el comando.', ephemeral: true };
    if (interaction.deferred || interaction.replied) {
      await interaction.followUp(errorReply);
    } else {
      await interaction.reply(errorReply);
    }
  }
});

// 🎧 Eventos de DisTube con embeds
client.distube
  .on('addSong', (queue, song) => {
    const embed = new EmbedBuilder()
      .setTitle('➕ Canción agregada')
      .setDescription(`[${song.name}](${song.url})`)
      .addFields(
        { name: '⏱ Duración', value: song.formattedDuration, inline: true },
        { name: '👤 Pedido por', value: song.user?.username || 'Desconocido', inline: true }
      )
      .setThumbnail(song.thumbnail || null)
      .setColor(0x00bfff)
      .setTimestamp();

    queue.textChannel?.send({ embeds: [embed] });
  })
  .on('addList', (queue, playlist) => {
    const embed = new EmbedBuilder()
      .setTitle('📃 Playlist agregada')
      .setDescription(`[${playlist.name}](${playlist.url})`)
      .addFields(
        { name: '🎶 Canciones', value: `${playlist.songs.length}`, inline: true },
        { name: '👤 Pedido por', value: playlist.user?.username || 'Desconocido', inline: true }
      )
      .setThumbnail(playlist.songs[0]?.thumbnail || null)
      .setColor(0x9b59b6)
      .setTimestamp();

    queue.textChannel?.send({ embeds: [embed] });
  })
  .on('finish', queue => {
    const embed = new EmbedBuilder()
      .setTitle('✅ Reproducción finalizada')
      .setDescription('La cola ha terminado. ¡Gracias por escuchar!')
      .setColor(0x2ecc71)
      .setTimestamp();

    queue.textChannel?.send({ embeds: [embed] });
  })
  .on('disconnect', queue => {
    const embed = new EmbedBuilder()
      .setTitle('📤 Desconectado')
      .setDescription('Me desconecté del canal de voz.')
      .setColor(0xe67e22)
      .setTimestamp();

    queue.textChannel?.send({ embeds: [embed] });
  })
  .on('empty', queue => {
    const embed = new EmbedBuilder()
      .setTitle('📭 Canal vacío')
      .setDescription('El canal de voz quedó vacío. Me desconecto automáticamente.')
      .setColor(0xf39c12)
      .setTimestamp();

    queue.textChannel?.send({ embeds: [embed] });
  })
  .on('error', async (queue, err) => {
    const textChannel = queue?.textChannel;
    if (!textChannel || typeof textChannel.send !== 'function') return;

    const embed = new EmbedBuilder()
      .setTitle('❌ Error al reproducir')
      .setColor(0xff0000)
      .setTimestamp();

    if (err instanceof Error && err.message) {
      console.error(`🎵 Error de DisTube: ${err.message}`);
      embed.setDescription(`**${err.message}**`);
    } else if (typeof err === 'string') {
      console.warn(`⚠️ Error recibido como texto: ${err}`);
      embed.setDescription(`⚠️ ${err}`);
    } else {
      console.warn('⚠️ DisTube lanzó un error inesperado:', util.inspect(err, { depth: 2, colors: true }));
      embed.setDescription('⚠️ Ocurrió un error interno. Revisá la consola para más detalles.');
    }

    await textChannel.send({ embeds: [embed] });

    // 🛠️ Fallback si SoundCloud falla
    if (err?.errorCode === 'SOUNDCLOUD_PLUGIN_RATE_LIMITED') {
      const fallbackEmbed = new EmbedBuilder()
        .setTitle('⚠️ SoundCloud alcanzó el límite')
        .setDescription('Intentando fallback en YouTube...')
        .setColor(0xffcc00)
        .setTimestamp();

      await textChannel.send({ embeds: [fallbackEmbed] });

      const fallbackChannel =
        client.ultimoMiembro?.voice?.channel ||
        textChannel.guild.channels.cache.get(client.canalPredeterminado.get(textChannel.guildId));

      if (fallbackChannel && client.ultimaBusqueda && client.ultimoMiembro) {
        try {
          await client.distube.play(fallbackChannel, `ytsearch:${client.ultimaBusqueda}`, {
            member: client.ultimoMiembro,
            textChannel
          });
        } catch (ytErr) {
          console.error('❌ Fallback a YouTube fallido:', ytErr);
          const ytErrorEmbed = new EmbedBuilder()
            .setTitle('❌ Fallback fallido')
            .setDescription(`No se pudo reproducir desde YouTube: ${ytErr.message}`)
            .setColor(0xff0000)
            .setTimestamp();

          await textChannel.send({ embeds: [ytErrorEmbed] });
        }
      } else {
                const noChannelEmbed = new EmbedBuilder()
          .setTitle('⚠️ Sin canal de voz disponible')
          .setDescription('No se encontró un canal de voz para el fallback.')
          .setColor(0xff9900)
          .setTimestamp();

        await textChannel.send({ embeds: [noChannelEmbed] });
      }
    }
  });

// 🧼 Captura de errores globales
process.on('unhandledRejection', err => {
  console.error('❌ Rechazo no manejado:', err);
});

process.on('uncaughtException', err => {
  console.error('💥 Excepción no capturada:', err);
});

// 🔐 Iniciar sesión
client.login(process.env.DISCORD_TOKEN);
