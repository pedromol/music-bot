import { entersState, joinVoiceChannel, VoiceConnectionStatus } from '@discordjs/voice';
import { Track } from '../music/track';
import Discord, { Snowflake, User } from 'discord.js';
import { Search } from '../music/search';
import { MusicSubscription } from '../music/subscription';
import { Command, Route } from './command';

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
      return this.reply({ content: 'Join a voice channel and then try that again!', followUp: true }, route);
    }

    // Make sure the connection is ready before processing the user's request
    try {
      await entersState(subscription.voiceConnection, VoiceConnectionStatus.Ready, 20e3);
    } catch (error) {
      console.warn(error);
      return this.reply(
        { content: 'Failed to join voice channel within 20 seconds, please try again later!', followUp: true },
        route,
      );
    }

    // Extract the video URL from the command
    const argument = this.getArgument(route);

    const user = this.getUser(route) as User;
    console.log(`${user?.username} requested ${argument}`);
    const normalizedUrl = await this.musicSearch.getUrl(argument, user);
    console.log(`${user?.username} got ${normalizedUrl}`);

    if (!normalizedUrl) {
      return this.reply({ content: 'Failed to find the track!', followUp: true }, route);
    }

    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    try {
      // Attempt to create a Track from the user's video URL
      const track = await Track.from(normalizedUrl, {
        onStart() {
          self.reply({ content: 'Now playing!', ephemeral: true, followUp: true }, route).catch(console.warn);
        },
        onFinish() {
          self.reply({ content: 'Now finished!', ephemeral: true, followUp: true }, route).catch(console.warn);
        },
        onError(error: Error) {
          console.warn(error);
          self
            .reply({ content: `Error: ${error.message}`, ephemeral: true, followUp: true }, route)
            .catch(console.warn);
        },
      });
      // Enqueue the track and reply a success message to the user
      subscription.enqueue(track);
      console.log(`Enqueued **${track.title}**`);
      await this.reply({ content: `Enqueued **${track.title}**`, followUp: true }, route);
    } catch (error) {
      console.warn(error);
      await this.reply({ content: 'Failed to play track, please try again later!' }, route);
    }
  }
}
