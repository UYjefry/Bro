const { EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'help',
  description: 'Muestra todos los comandos disponibles',
  async execute(message, args, client) {
    try {
      const prefixList = client.commands?.map(cmd => `\`${cmd.name}\``).join(', ') || 'Ninguno';
      const slashList = client.slashCommands?.map(cmd => `\`/${cmd.data.name}\``).join(', ') || 'Ninguno';

      const embed = new EmbedBuilder()
        .setTitle('📚 Lista de comandos')
        .setColor(0x00BFFF)
        .setDescription('Aquí están los comandos disponibles para este bot:')
        .addFields(
          { name: `🔹 Comandos prefix (${client.prefix})`, value: prefixList },
          { name: '🔹 Comandos slash', value: slashList }
        )
        .setFooter({ text: `Solicitado por ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
        .setTimestamp();

      await message.reply({ embeds: [embed] });
    } catch (error) {
      console.error('❌ Error en !help:', error);
      message.reply('❌ Hubo un error al mostrar los comandos.');
    }
  }
};
