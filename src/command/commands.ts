import { Snowflake, Client } from 'discord.js';
import { MusicSubscription } from '../music/subscription';
import { Command, Route } from './command';
import { Deploy } from './deploy';
import { Leave } from './leave';
import { Pause } from './pause';
import { Play } from './play';
import { Resume } from './resume';
import { Skip } from './skip';
import { Queue } from './queue';

export class Commands extends Command {
  commandPrefix = process.env['DISCORD_COMMAND_PREFIX'] ?? '!';
  commands: Command[];

  constructor(client: Client, subscriptions: Map<Snowflake, MusicSubscription>) {
    super(client, subscriptions);
    this.commands = [Leave, Pause, Play, Queue, Resume, Skip].map((clazz) => new clazz(client, subscriptions));
    this.commands.push(new Deploy(client, subscriptions, this.commands));
  }

  async execute(route: Route): Promise<void> {
    let command;
    if (route.message && route.message.content[0] === this.commandPrefix) {
      command = this.commands.find((cmd) => cmd.metadata?.name === route.message?.content.split(' ')[0]);
    }

    if ((route.interaction && route.interaction.isCommand()) || route.interaction?.guildId) {
      command = this.commands.find((cmd) => cmd.metadata?.name === route.interaction?.commandName);
    }

    if (command) {
      command.execute(route);
    }

    return this.reply({ content: 'Unknown command' }, route);
  }
}
