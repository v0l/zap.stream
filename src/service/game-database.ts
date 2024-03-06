export default class GameDatabase {
    readonly url = "https://api.zap.stream/api/v1";

    async searchGames(search: string, limit = 10) {
        const rsp = await fetch(`${this.url}/games/search?q=${encodeURIComponent(search)}&limit=${limit}`);
        if (rsp.ok) {
            const games = await rsp.json() as Array<GameInfo>;
            return games.map(a => ({
                ...a,
                genres: [...a.genres, "gaming"]
            }));
        }
        return [];
    }

    async getGame(id: string) {
        const rsp = await fetch(`${this.url}/games/${id}`);
        if (rsp.ok) {
            return await rsp.json() as GameInfo | undefined;
        }
    }
}

export interface GameInfo {
    id: string;
    name: string | JSX.Element;
    cover?: string;
    genres: Array<string>;
    className?: string;
}
