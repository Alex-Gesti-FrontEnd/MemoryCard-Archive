export interface GameModel {
  id?: number;
  name: string;
  platform: string;
  region: string;
  genre?: string;
  releaseDate?: string;
  image?: string;
  status?: 'backlog' | 'playing' | 'completed';
  format?: 'physical' | 'digital';
  game_url?: string;
  game_type?: number;
  igdb_id?: number;
}
