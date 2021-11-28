import { AudioResource, createAudioResource, demuxProbe } from '@discordjs/voice';
import { User } from 'discord.js';
import { exec as ytdl } from 'youtube-dl-exec';
import { Search } from './search';

/**
 * This is the data required to create a Track object
 */
export interface TrackData {
  title: string;
  author: string;
  url: string;
  thumbnail: string;
  duration: string;
  requestedBy: User;
}

export interface TrackAction extends TrackData {
  search: Search;
  onStart: () => void;
  onFinish: () => void;
  onError: (error: Error) => void;
}

// eslint-disable-next-line @typescript-eslint/no-empty-function
const noop = (): void => {};

/**
 * A Track represents information about a YouTube video (in this context) that can be added to a queue.
 * It contains the title and URL of the video, as well as functions onStart, onFinish, onError, that act
 * as callbacks that are triggered at certain points during the track's lifecycle.
 *
 * Rather than creating an AudioResource for each video immediately and then keeping those in a queue,
 * we use tracks as they don't pre-emptively load the videos. Instead, once a Track is taken from the
 * queue, it is converted into an AudioResource just in time for playback.
 */
export class Track implements TrackAction {
  public readonly title: string;
  public readonly author: string;
  public url: string;
  public readonly thumbnail: string;
  public readonly duration: string;
  public readonly requestedBy: User;
  public readonly onStart: () => void;
  public readonly onFinish: () => void;
  public readonly search: Search;
  public readonly onError: (error: Error) => void;

  private constructor(trackAction: TrackAction) {
    this.title = trackAction.title;
    this.author = trackAction.author;
    this.url = trackAction.url;
    this.thumbnail = trackAction.thumbnail;
    this.duration = trackAction.duration;
    this.requestedBy = trackAction.requestedBy;
    this.search = trackAction.search;
    this.onStart = trackAction.onStart;
    this.onFinish = trackAction.onFinish;
    this.onError = trackAction.onError;
  }

  /**
   * Creates an AudioResource from this Track.
   */
  public createAudioResource(): Promise<AudioResource<Track>> {
    return new Promise(async (resolve, reject) => {
      this.url = (await this.search.getYtUrl(this)) ?? this.url;
      console.log(`Playing ${this.url}: Author: ${this.author} - Title ${this.title}`);
      const process = ytdl(
        this.url,
        {
          output: '-',
          quiet: true,
          format: 'bestaudio[ext=webm+acodec=opus+asr=48000]/bestaudio',
          limitRate: '100K',
        },
        { stdio: ['ignore', 'pipe', 'ignore'] },
      );
      if (!process.stdout) {
        reject(new Error('No stdout'));
        return;
      }
      const stream = process.stdout;
      const onError = (error: Error): void => {
        if (!process.killed) process.kill();
        stream.resume();
        reject(error);
      };
      process
        .once('spawn', () => {
          demuxProbe(stream)
            .then((probe) => resolve(createAudioResource(probe.stream, { metadata: this, inputType: probe.type })))
            .catch(onError);
        })
        .catch(onError);
    });
  }

  /**
   * Creates a Track from a video URL and lifecycle callback methods.
   *
   * @param url The URL of the video
   * @param methods Lifecycle callbacks
   * @returns The created Track
   */
  public static from(
    trackData: TrackData,
    methods: Pick<Track, 'onStart' | 'onFinish' | 'onError'>,
    search: Search,
  ): Track {
    // The methods are wrapped so that we can ensure that they are only called once.
    const wrappedMethods = {
      onStart(): void {
        wrappedMethods.onStart = noop;
        methods.onStart();
      },
      onFinish(): void {
        wrappedMethods.onFinish = noop;
        methods.onFinish();
      },
      onError(error: Error): void {
        wrappedMethods.onError = noop;
        methods.onError(error);
      },
    };

    return new Track({
      ...trackData,
      ...wrappedMethods,
      search,
    });
  }
}
