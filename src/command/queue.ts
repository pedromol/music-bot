import { AudioPlayerStatus, AudioResource } from '@discordjs/voice';
import { Track } from 'discord-player';
import { Command, Route } from './command';

export class Queue extends Command {
  metadata = {
    name: 'queue',
    description: 'See the music queue',
  };

  public async execute(route: Route): Promise<void> {
    const subscription = await this.getSubscription(route);
    // Print out the current queue, including up to the next 5 tracks to be played.
    if (subscription) {
      const current =
        subscription.audioPlayer.state.status === AudioPlayerStatus.Idle
          ? `Nothing is currently playing!`
          : `Playing **${(subscription.audioPlayer.state.resource as AudioResource<Track>).metadata.title}**`;

      const queue = subscription.queue
        .slice(0, 5)
        .map((track, index) => `${index + 1}) ${track.title}`)
        .join('\n');

      return this.reply({ content: `${current}\n\n${queue}` }, route);
    }
  }
}
