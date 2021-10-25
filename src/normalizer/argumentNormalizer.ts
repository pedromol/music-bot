import { Player } from 'discord-player';
import * as ytdl from 'ytdl-core';
export class argumentNormalizer {
  private player;
  constructor(client: any) {
    this.player = new Player(client);
  }

  public async getUrl(argument: string, user: any): Promise<string | undefined> {
    if (ytdl.validateURL(argument)) {
      return argument;
    }

    const searchResult = await this.player.search(argument, { requestedBy: user });
    if (searchResult.tracks.length > 0) {
      if (ytdl.validateURL(searchResult.tracks[0].url)) {
        return searchResult.tracks[0].url;
      }
      if (searchResult.tracks[0].title && searchResult.tracks[0].author) {
        return this.getUrl(`${searchResult.tracks[0].author} ${searchResult.tracks[0].title}`, user);
      }
    }

    return undefined;
  }
}
