export interface GameModel {
  id?: number;
  name: string;
  platform: string;
  region: string;
  genre?: string;
  releaseDate?: string | null;
  image?: string;
  status?: 'backlog' | 'playing' | 'completed';
  format?: 'physical' | 'digital';
  game_url?: string | null;
  game_type?: number;
  rating?: number | null;
  screenshots?: string[];
  artworks?: string[];
  companies?: string[];
  summary?: string | null;
}
