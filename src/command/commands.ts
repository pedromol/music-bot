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
  commands: Command[];

  constructor(client: Client, subscriptions: Map<Snowflake, MusicSubscription>) {
    super(client, subscriptions);
    this.commands = [Leave, Pause, Play, Queue, Resume, Skip].map((clazz) => new clazz(client, subscriptions));
    this.commands.push(new Deploy(client, subscriptions, this.commands));
  }

  async execute(route: Route): Promise<void> {
    let command;
    if (route.message) {
      command = this.commands.find((cmd) => cmd.metadata?.name === route.message?.content.substr(1).split(' ')[0]);
    }

    if ((route.interaction && route.interaction.isCommand()) || route.interaction?.guildId) {
      command = this.commands.find((cmd) => cmd.metadata?.name === route.interaction?.commandName);
    }

    if (command) {
      return command.execute(route);
    }

    return this.reply({ content: 'Unknown command' }, route);
  }
}
