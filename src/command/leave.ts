import { Command, Route } from './command';

export class Leave extends Command {
  metadata = {
    name: 'leave',
    description: 'Leave the voice channel',
  };

  public async execute(route: Route): Promise<void> {
    const subscription = await this.getSubscription(route);

    if (subscription) {
      subscription.voiceConnection.destroy();
      this.removeSubscription(route);
      return this.reply({ content: `Left channel!`, ephemeral: true }, route);
    }
  }
}
