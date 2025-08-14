module.exports = {
  name: 'establecer',
  description: 'Establece el canal de voz predeterminado para este servidor',
  async execute(message, args, client) {
    if (!message.member.permissions.has('Administrator')) {
      return message.reply('🚫 Solo administradores pueden usar este comando.');
    }

    const canalId = args[0];
    if (!canalId || !/^\d{17,19}$/.test(canalId)) {
      return message.reply('⚠️ Debes proporcionar un ID de canal de voz válido.');
    }

    const canal = message.guild.channels.cache.get(canalId);
    if (!canal || canal.type !== 2) {
      return message.reply('❌ Ese ID no corresponde a un canal de voz.');
    }

    client.canalPredeterminado.set(message.guild.id, canalId);
    message.reply(`✅ Canal de voz predeterminado establecido: **${canal.name}**`);
  }
};
