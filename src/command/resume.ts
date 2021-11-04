import { Command, Route } from './command';

export class Resume extends Command {
  metadata = {
    name: 'resume',
    description: 'Resume playback of the current song',
  };

  public async execute(route: Route): Promise<void> {
    const subscription = await this.getSubscription(route);
    if (subscription) {
      subscription.audioPlayer.unpause();
      return this.reply({ content: `Unpaused!`, ephemeral: true }, route);
    }
  }
}
