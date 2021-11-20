import { User, Client } from 'discord.js';
import { Player, Playlist } from 'discord-player';
import * as ytdl from 'ytdl-core';
import { TrackData } from './track';
export class Search {
  private player;
  constructor(client: Client) {
    this.player = new Player(client);
  }

  public async getTrackData(
    argument: string,
    user: User,
  ): Promise<
    | {
        playlist?: Playlist;
        tracks: TrackData[];
      }
    | undefined
  > {
    const searchResult = await this.player.search(argument, { requestedBy: user });
    if (searchResult.tracks.length > 0) {
      if (searchResult.playlist) {
        return searchResult;
      } else {
        if (ytdl.validateURL(searchResult.tracks[0].url)) {
          return { tracks: [searchResult.tracks[0]] };
        }
        if (searchResult.tracks[0].title && searchResult.tracks[0].author) {
          return this.getTrackData(`${searchResult.tracks[0].author} ${searchResult.tracks[0].title}`, user);
        }
      }
    }
    return undefined;
  }

  public async getYtUrl(trackData: TrackData): Promise<string | undefined> {
    if (ytdl.validateURL(trackData.url)) {
      console.log(`valid ${trackData.url}`);
      return trackData.url;
    }

    const searchResult = await this.player.search(`${trackData.author} ${trackData.title}`, {
      requestedBy: trackData.requestedBy,
    });
    if (searchResult?.tracks.length && ytdl.validateURL(searchResult.tracks[0].url)) {
      return searchResult.tracks[0].url;
    }

    return undefined;
  }
}
