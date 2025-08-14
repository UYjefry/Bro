const axios = require('axios');
const { EmbedBuilder } = require('discord.js');

const OPENROUTER_KEY = process.env.OPENROUTER_KEY;
if (!OPENROUTER_KEY) {
  console.error('❌ Falta OPENROUTER_KEY en el archivo .env');
}

let iaActiva = false;
let ultimaLlamada = 0;
const intervaloMinimo = 5000;

async function responderConIA(mensaje, canal) {
  const ahora = Date.now();
  if (ahora - ultimaLlamada < intervaloMinimo) return;
  ultimaLlamada = ahora;

  try {
    const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
      model: 'ai21/jamba-mini-1.7',
      messages: [
        {
          role: 'system',
          content: 'Sos un bot de Discord con chispa, rápido para responder, amigable y con un toque de humor. Sé útil, pero no aburrido.'
        },
        {
          role: 'user',
          content: mensaje
        }
      ],
      temperature: 0.6,
      max_tokens: 150
    }, {
      headers: {
        'Authorization': `Bearer ${OPENROUTER_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const texto = response.data.choices[0].message.content;
    const embed = new EmbedBuilder()
      .setTitle('🤖 Respuesta de la IA')
      .setDescription(texto)
      .setColor(0x00BFFF)
      .setFooter({ text: 'Generado por OpenRouter', iconURL: 'https://openrouter.ai/favicon.ico' })
      .setTimestamp();

    canal.send({ embeds: [embed] });
  } catch (error) {
    const detalle = error.response?.data?.error?.message || error.response?.data || error.message;
    console.error('❌ Error IA:', detalle);

    const errorEmbed = new EmbedBuilder()
      .setTitle('⚠️ Error al contactar con la IA')
      .setDescription(`\`${detalle}\``)
      .setColor(0xFF0000);

    canal.send({ embeds: [errorEmbed] });
  }
}

module.exports = {
  name: 'ia',
  description: 'Controlar la IA conversacional',
  async execute(message, args, client) {
    const subcomando = args[0]?.toLowerCase();

    if (subcomando === 'on') {
      iaActiva = true;
      return message.channel.send({
        embeds: [new EmbedBuilder()
          .setTitle('✅ IA activada')
          .setDescription('¡Listo para charlar con estilo!')
          .setColor(0x00FF00)]
      });
    }

    if (subcomando === 'off') {
      iaActiva = false;
      return message.channel.send({
        embeds: [new EmbedBuilder()
          .setTitle('🛑 IA desactivada')
          .setDescription('La IA ha sido silenciada por ahora.')
          .setColor(0xFF0000)]
      });
    }

    if (subcomando === 'estado') {
      return message.channel.send({
        embeds: [new EmbedBuilder()
          .setTitle('📡 Estado de la IA')
          .setDescription(`Actualmente está: ${iaActiva ? '🟢 Activada' : '🔴 Desactivada'}`)
          .setColor(iaActiva ? 0x00FF00 : 0xFF0000)]
      });
    }

    if (subcomando === 'decir') {
      const texto = args.slice(1).join(' ');
      if (!texto) {
        return message.channel.send({
          embeds: [new EmbedBuilder()
            .setTitle('⚠️ Faltó el mensaje')
            .setDescription('Escribí algo para que la IA lo diga.')
            .setColor(0xFFA500)]
        });
      }
      return responderConIA(texto, message.channel);
    }

    // Ayuda del comando
    const ayudaEmbed = new EmbedBuilder()
      .setTitle('📘 Uso del comando !ia')
      .setColor(0x5865F2)
      .setDescription('Controla la IA conversacional del bot')
      .addFields(
        { name: '`!ia on`', value: 'Activa la IA' },
        { name: '`!ia off`', value: 'Desactiva la IA' },
        { name: '`!ia estado`', value: 'Muestra si está activa' },
        { name: '`!ia decir [mensaje]`', value: 'Envía el mensaje a la IA para que responda' }
      )
      .setFooter({ text: 'IA impulsada por OpenRouter' });

    return message.channel.send({ embeds: [ayudaEmbed] });
  }
};
