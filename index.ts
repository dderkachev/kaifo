import { ChannelType, Client, Collection, GatewayIntentBits, Partials, REST, Routes } from 'discord.js';
import { config } from 'dotenv';

config();

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildVoiceStates],
  partials: [Partials.Message, Partials.Message, Partials.GuildMember, Partials.ThreadMember, Partials.Channel],
});

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN!);

let voiceManager = new Collection();

const main = async () => {
  const commands: any = [
    {
      name: 'ping',
      description: 'Replies with Pong!',
    },
  ];

  try {
    console.log('Started refreshing application (/) commands.');

    await rest.put(Routes.applicationGuildCommands(process.env.CLIENT_ID!, process.env.GUILD_ID!), { body: commands });

    console.log('Successfully reloaded application (/) commands.');
  } catch (error) {
    console.error(error);
  }
};

client.login(process.env.TOKEN!);

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'ping') {
    await interaction.reply('Pong!');
  }
});

client.on('voiceStateUpdate', async (oldState, newState) => {
  const { member, guild } = newState;
  const oldChannel = oldState.channel;
  const newChannel = newState.channel;
  const joinChannel = '1002961061672132619';

  if (oldChannel !== newChannel && newChannel && newChannel.id === joinChannel) {
    const voiceChannel = await guild!.channels.create({
      name: member!.user.tag,
      type: ChannelType.GuildVoice,
      parent: newChannel.parent,
      permissionOverwrites: [
        { id: member!.id, allow: ['Connect'] },
        { id: guild.id, allow: ['Connect'] },
      ],
    });

    voiceManager.set(member!.id, voiceChannel.id);

    await newChannel.permissionOverwrites.edit(member!, { Connect: true });

    setTimeout(() => {
      newChannel.permissionOverwrites.delete(member!);
    }, 30 * 1000);

    setTimeout(() => {
      member!.voice.setChannel(voiceChannel);
    }, 600);
  }

  const createdChannel = voiceManager.get(member!.id);
  const members = oldChannel?.members.map((member) => member.id);

  if (
    createdChannel &&
    oldChannel &&
    oldChannel!.id === createdChannel &&
    (!newChannel || newChannel.id !== createdChannel)
  ) {
    if (members && members.length > 0) {
      let randomID = members[Math.floor(Math.random() * members.length)];
      let anotherMember = guild.members.cache.get(randomID);

      anotherMember!.voice.setChannel(oldChannel).then(() => {
        oldChannel.setName(anotherMember!.user.username).catch((e) => e);
        oldChannel.permissionOverwrites.edit(anotherMember!, {
          Connect: true,
          ManageChannels: true,
        });
      });

      voiceManager.set(member!.id, null);
      voiceManager.set(anotherMember!.id, oldChannel!.id);
    } else {
      voiceManager.set(member!.id, null);
      oldChannel!.delete().catch((e) => e);
    }
  }
});

client.once('ready', () => {
  console.log('Ready!');
});

main();
