import { Command, Route } from './command';

export class Skip extends Command {
  metadata = {
    name: 'skip',
    description: 'Skip to the next song in the queue',
  };

  public async execute(route: Route): Promise<void> {
    const subscription = await this.getSubscription(route);
    if (subscription) {
      // Calling .stop() on an AudioPlayer causes it to transition into the Idle state. Because of a state transition
      // listener defined in music/subscription.ts, transitions into the Idle state mean the next track from the queue
      // will be loaded and played.
      subscription.audioPlayer.stop();
      return this.reply({ content: 'Skipped song!' }, route);
    }
  }
}
