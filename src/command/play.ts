import { entersState, joinVoiceChannel, VoiceConnectionStatus } from '@discordjs/voice';
import { Track } from '../music/track';
import Discord, { MessageEmbed, Snowflake, User } from 'discord.js';
import { Search } from '../music/search';
import { MusicSubscription } from '../music/subscription';
import { Command, Route } from './command';
import { Duration } from '../music/duration';

export class Play extends Command {
  private musicSearch: Search;

  metadata = {
    name: 'play',
    description: 'Plays a song',
    options: [
      {
        name: 'song',
        type: 'STRING' as const,
        description: 'The URL of the song to play',
        required: true,
      },
    ],
  };

  constructor(client: Discord.Client, subscriptions: Map<Snowflake, MusicSubscription>) {
    super(client, subscriptions);
    this.musicSearch = new Search(this.client);
  }

  public async execute(route: Route): Promise<void> {
    if (route.interaction) await route.interaction.deferReply();
    let subscription = await this.getSubscription(route, false);

    // If a connection to the guild doesn't already exist and the user is in a voice channel, join that channel
    // and create a subscription.
    if (!subscription) {
      const channel = this.getChannel(route);
      if (channel) {
        subscription = new MusicSubscription(
          joinVoiceChannel({
            channelId: channel.id,
            guildId: channel.guild.id,
            adapterCreator: channel.guild.voiceAdapterCreator,
          }),
        );
        subscription.voiceConnection.on('error', console.warn);
        this.setSubscription(route, subscription);
      }
    }

    // If there is no subscription, tell the user they need to join a channel.
    if (!subscription) {
      return this.reply({ content: ':x: Join a voice channel and then try that again.', followUp: true }, route);
    }

    // Make sure the connection is ready before processing the user's request
    try {
      await entersState(subscription.voiceConnection, VoiceConnectionStatus.Ready, 20e3);
    } catch (error) {
      console.warn(error);
      return this.reply(
        { content: ':sos: Failed to join voice channel within 20 seconds, please try again later.', followUp: true },
        route,
      ).then(() => {
        console.error('Killing');
        process.exit(1);
      });
    }

    // Extract the video URL from the command
    const argument = this.getArgument(route);

    const user = this.getUser(route) as User;
    console.log(`${user.username} requested ${argument}`);
    const trackData = await this.musicSearch.getTrackData(argument, user);

    if (!trackData || !trackData.tracks.length) {
      return this.reply({ content: ':mag_right: Failed to find the track.', followUp: true }, route);
    }

    const duration = new Duration();

    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    try {
      trackData.tracks.forEach((trackData) => {
        // Attempt to create a Track from the user's video URL
        const track = Track.from(
          trackData,
          {
            onStart() {
              // self.reply({ content: 'Now playing!', ephemeral: true, followUp: true }, route).catch(console.warn);
            },
            onFinish() {
              // self.reply({ content: 'Now finished!', ephemeral: true, followUp: true }, route).catch(console.warn);
            },
            onError(error: Error) {
              console.warn(error);
              self
                .reply({ content: `:sos: Error: ${error.message}`, ephemeral: true, followUp: true }, route)
                .catch(console.warn);
            },
          },
          self.musicSearch,
        );
        // Enqueue the track
        if (subscription) subscription.enqueue(track);
        duration.addTime(track.duration);
      });

      const enqueued = trackData.playlist ?? trackData.tracks[0];
      const author = trackData.playlist?.author?.name ?? trackData.tracks[0].author;
      const response = new MessageEmbed()
        .setColor('#7289da')
        .setTitle(enqueued.title.includes(author) ? enqueued.title : `${author} - ${enqueued.title}`)
        .setURL(enqueued.url)
        .setAuthor(`${user.username} added to queue`, user.displayAvatarURL())
        .setThumbnail(enqueued.thumbnail)
        .addField('Channel', this.getChannel(route)?.name ?? 'Unknown', true)
        .addField('Song duration', duration.getTime(), true)
        .setTimestamp()
        .setFooter(`Queue size: ${subscription.queue.length}`);

      await this.reply(
        {
          embeds: [response],
          followUp: true,
        },
        route,
      );
    } catch (error) {
      console.warn(error);
      await this.reply({ content: ':sos: Failed to play track, please try again later.' }, route);
    }
  }
}
