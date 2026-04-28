/**
 * Game database client for the zap.stream IGDB-powered game search API.
 */
export class GameDatabase {
  readonly url: string;

  constructor(url = "https://api-core.zap.stream/api/v1") {
    this.url = url;
  }

  async searchGames(search: string, limit = 10): Promise<Array<GameInfo>> {
    const rsp = await fetch(`${this.url}/games/search?q=${encodeURIComponent(search)}&limit=${limit}`);
    if (rsp.ok) {
      const games = (await rsp.json()) as Array<GameInfo>;
      return games.map(a => ({
        ...a,
        cover: a.cover
          ? {
              ...a.cover,
              url: `https://images.igdb.com/igdb/image/upload/t_cover_big/${a.cover.image_id}.jpg`,
            }
          : undefined,
        genres: [{ id: 0, name: "gaming" }, ...(a.genres ?? [])],
      }));
    }
    return [];
  }

  async getGame(id: string): Promise<GameInfo | undefined> {
    const igId = id.startsWith("igdb:") ? id.split(":")[1] : id;
    const rsp = await fetch(`${this.url}/games/${igId}`);
    if (rsp.ok) {
      const gameInfo = (await rsp.json()) as GameInfo | undefined;
      if (gameInfo?.cover) {
        gameInfo.cover.url = `https://images.igdb.com/igdb/image/upload/t_cover_big/${gameInfo.cover.image_id}.jpg`;
      }
      return gameInfo;
    }
    return undefined;
  }
}

export interface GameInfo {
  id: string;
  name: string;
  cover?: GameCover;
  genres?: Array<GameGenre>;
  summary?: string;
}

export interface GameCover {
  id: number;
  image_id: string;
  url?: string;
}

export interface GameGenre {
  id: number;
  name: string;
}
