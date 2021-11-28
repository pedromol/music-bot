import { AudioPlayerStatus, AudioResource } from '@discordjs/voice';
import { Track } from 'discord-player';
import { MessageEmbed } from 'discord.js';
import { Duration } from '../music/duration';
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
      if (subscription.audioPlayer.state.status === AudioPlayerStatus.Idle) {
        return this.reply({ content: `:mute: Nothing is currently playing.` }, route);
      }

      const duration = new Duration();
      subscription.queue.forEach((track) => duration.addTime(track.duration));

      const trackMetadata = (subscription.audioPlayer.state.resource as AudioResource<Track>).metadata;

      const response = new MessageEmbed()
        .setColor('#7289da')
        .setTitle(
          trackMetadata.title.includes(trackMetadata.author)
            ? trackMetadata.title
            : `${trackMetadata.author} - ${trackMetadata.title}`,
        )
        .setURL(trackMetadata.url)
        .setAuthor(
          `${trackMetadata.requestedBy.username} added this song to queue`,
          trackMetadata.requestedBy.displayAvatarURL(),
        )
        .setThumbnail(trackMetadata.thumbnail)
        .addField('Channel', this.getChannel(route)?.name ?? 'Unknown', true)
        .addField('Song duration', trackMetadata.duration, true)
        .addFields(
          subscription.queue.slice(0, 5).map((track, index) => {
            return {
              name: `${index + 1}. ${
                track.title.includes(track.author) ? track.title : `${track.author} - ${track.title}`
              }`,
              value: track.duration,
            };
          }),
        )
        .setTimestamp()
        .setFooter(`Queue size: ${subscription.queue.length} - Queue duration ${duration.getTime()}`);

      return this.reply({ embeds: [response] }, route);
    }
  }
}
