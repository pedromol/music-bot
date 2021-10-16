import youtubeSearch from "youtube-search";

export class argumentNormalizer {
  constructor(private ytApiKey = process.env['YT_API_KEY']) {}

  public async getUrl(argument: string): Promise<string | undefined> {
    if (this.isYtUrl(argument)) {
      return argument;
    }

    if (!this.ytApiKey) {
      return undefined;
    }

    const searchQuery = this.getYtSearchQuery(argument);
    if (searchQuery) {
      return this.ytSearch(searchQuery);
    }

    return this.ytSearch(argument);
  }

  private isYtUrl(argument: string): boolean {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|\?v=)([^#\&\?]*).*/;
    const match = argument.match(regExp);
    return (match && match[2]?.length === 11) as boolean;
  }

  private getYtSearchQuery(argument: string): string | undefined {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|results\?search_query=)([^#\&\?]+).*/;
    const match = argument.match(regExp);
    if (match && match?.length > 2) {
      return decodeURIComponent(match[2]);
    }
    return undefined;
  }

  private async ytSearch(query: string): Promise<string | undefined> {
    return youtubeSearch(query, { maxResults: 1, key: this.ytApiKey }).then((result) => {
        if (result?.results && result?.results?.length > 0) {
            return `https://www.youtube.com/watch?v=${result.results[0].id}`;
        }
        return undefined;
    });
  }
}
