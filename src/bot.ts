import Discord, { BaseCommandInteraction, Interaction, Message } from 'discord.js';
import { Commands } from './command/commands';
import { MusicSubscription } from './music/subscription';

const discordToken = process.env['DISCORD_TOKEN'];

const client = new Discord.Client({ intents: ['GUILD_VOICE_STATES', 'GUILD_MESSAGES', 'GUILDS'] });
const commands = new Commands(client, new Map<string, MusicSubscription>());

client.on('messageCreate', async (message: Message): Promise<void> => {
  return commands.execute({ message: message });
});

// Handles slash command interactions
client.on('interactionCreate', async (interaction: Interaction): Promise<void> => {
  return commands.execute({ interaction: interaction as BaseCommandInteraction });
});

client.on('ready', () => console.log('Ready!'));
client.on('error', console.error);
process.on('uncaughtException', console.error);

const keepAlive = (): Promise<string> => {
  return client.login(discordToken).catch((e): Promise<string> => {
    console.error(e);
    if (!process.env['KEEP_ALIVE']) {
      process.exit(1);
    }
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(keepAlive());
      }, 2000);
    });
  });
};

keepAlive();
