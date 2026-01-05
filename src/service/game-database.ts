export default class GameDatabase {
  readonly url = "https://api-core.zap.stream/api/v1";

  async searchGames(search: string, limit = 10): Promise<Array<GameInfo>> {
    const rsp = await fetch(`${this.url}/games/search?q=${encodeURIComponent(search)}&limit=${limit}`);
    if (rsp.ok) {
      const games = (await rsp.json()) as Array<GameInfo>;
      return games.map(a => ({
        ...a,
        cover: a.cover ? {
          ...a.cover,
          url: `https://images.igdb.com/igdb/image/upload/t_cover_big/${a.cover.image_id}.jpg`
        } : undefined,
        genres: [{ id: 0, name: "gaming" }, ...(a.genres ?? [])],
      }));
    }
    return [];
  }

  async getGame(id: string) {
    const igId = id.startsWith("igdb:") ? id.split(":")[1] : id;
    const cacheKey = `game:${igId}`;
    const cached = window.sessionStorage.getItem(cacheKey);
    if (cached) {
      return JSON.parse(cached) as GameInfo;
    }
    const rsp = await fetch(`${this.url}/games/${igId}`);
    if (rsp.ok) {
      const gameInfo = (await rsp.json()) as Array<GameInfo> | undefined;
      const info = gameInfo?.[0];
      if (info) {
        if (info.cover) {
          info.cover.url = `https://images.igdb.com/igdb/image/upload/t_cover_big/${info.cover.image_id}.jpg`
        }
        window.sessionStorage.setItem(cacheKey, JSON.stringify(info));
      }
      return info;
    }
  }
}

export interface GameInfo {
  id: string;
  name: string | JSX.Element;
  cover?: GameCover;
  genres?: Array<GameGenre>;
  summary?: string;
  className?: string;
}

export interface GameCover {
  id: number,
  image_id: string,
  url?: string,
}

export interface GameGenre {
  id: number;
  name: string;
}