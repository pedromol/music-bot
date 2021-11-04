import { ApplicationCommandData, Client, Snowflake } from 'discord.js';
import { MusicSubscription } from '../music/subscription';
import { Command, Route } from './command';

export class Deploy extends Command {
  commands: Command[];
  metadata = {
    name: 'deploy',
    description: 'Deploy slash commands to the server',
    ignoreSlash: true,
  };

  constructor(client: Client, subscriptions: Map<Snowflake, MusicSubscription>, commands: Command[]) {
    super(client, subscriptions);
    this.commands = commands;
  }

  public async execute(route: Route): Promise<void> {
    if (route.message) {
      if (!this.client.application?.owner) await this.client.application?.fetch();

      if (
        route.message?.content?.toLowerCase() === '!deploy' &&
        route.message?.author?.id === this.client?.application?.owner?.id &&
        route.message.guild
      ) {
        await route.message.guild.commands.set(
          this.commands.filter((cmd) => cmd.metadata).map((cmd) => cmd.metadata as ApplicationCommandData),
        );

        return this.reply({ content: 'Deployed!' }, route);
      }
    }
  }
}
