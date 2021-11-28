import { Command, Route } from './command';
const ALLOW_ANYONE_TO_KILL = process.env['ALLOW_ANYONE_TO_KILL'] === 'true';

export class Kill extends Command {
  metadata = {
    name: 'kill',
    description: 'Kill the bot.',
    ignoreSlash: true,
  };

  public async execute(route: Route): Promise<void> {
    if (route.message) {
      if (!this.client.application?.owner) await this.client.application?.fetch();

      if (
        (route.message?.author?.id === this.client?.application?.owner?.id || ALLOW_ANYONE_TO_KILL) &&
        route.message.guild
      ) {
        process.exit(1);
      }
    }
  }
}
