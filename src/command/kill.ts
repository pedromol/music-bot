import { Command, Route } from './command';

export class Kill extends Command {
  metadata = {
    name: 'kill',
    description: 'Kill the bot.',
    ignoreSlash: true,
  };

  public async execute(route: Route): Promise<void> {
    if (route.message) {
      if (!this.client.application?.owner) await this.client.application?.fetch();

      if (route.message?.author?.id === this.client?.application?.owner?.id && route.message.guild) {
        process.exit(1);
      }
    }
  }
}
