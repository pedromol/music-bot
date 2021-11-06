import { Command, Route } from './command';

export class Pause extends Command {
  metadata = {
    name: 'pause',
    description: 'Pauses the song that is currently playing',
  };

  public async execute(route: Route): Promise<void> {
    const subscription = await this.getSubscription(route);

    if (subscription) {
      subscription.audioPlayer.pause();
      return this.reply({ content: `Paused!`, ephemeral: true }, route);
    }
  }
}
