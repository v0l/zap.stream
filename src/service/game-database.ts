export default class GameDatabase {
  readonly url = "https://api.zap.stream/api/v1";

  async searchGames(search: string, limit = 10) {
    const rsp = await fetch(`${this.url}/games/search?q=${encodeURIComponent(search)}&limit=${limit}`);
    if (rsp.ok) {
      const games = (await rsp.json()) as Array<GameInfo>;
      return games.map(a => ({
        ...a,
        genres: [...a.genres, "gaming"],
      }));
    }
    return [];
  }

  async getGame(id: string) {
    const cacheKey = `game:${id}`;
    const cached = window.sessionStorage.getItem(cacheKey);
    if (cached) {
      return JSON.parse(cached) as GameInfo;
    }
    const rsp = await fetch(`${this.url}/games/${id}`);
    if (rsp.ok) {
      const info = (await rsp.json()) as GameInfo | undefined;
      if (info) {
        window.sessionStorage.setItem(cacheKey, JSON.stringify(info));
      }
      return info;
    }
  }
}

export interface GameInfo {
  id: string;
  name: string | JSX.Element;
  cover?: string;
  genres: Array<string>;
  summary?: string;
  className?: string;
}
