import dotenv from 'dotenv';

dotenv.config();

let cachedToken = null;
let tokenExpiresAt = 0;

async function getAccessToken() {
  if (cachedToken && Date.now() < tokenExpiresAt) {
    return cachedToken;
  }

  const response = await fetch(
    `https://id.twitch.tv/oauth2/token?client_id=${process.env.IGDB_CLIENT_ID}&client_secret=${process.env.IGDB_CLIENT_SECRET}&grant_type=client_credentials`,
    { method: 'POST' },
  );

  const data = await response.json();

  cachedToken = data.access_token;
  tokenExpiresAt = Date.now() + data.expires_in * 1000;

  return cachedToken;
}

export async function getPopularGames(limit = 50, offset = 0) {
  const token = await getAccessToken();

  const now = Math.floor(Date.now() / 1000);

  const response = await fetch('https://api.igdb.com/v4/games', {
    method: 'POST',
    headers: {
      'Client-ID': process.env.IGDB_CLIENT_ID,
      Authorization: `Bearer ${token}`,
    },
    body: `
      fields 
        name,
        cover.url,
        screenshots.url,
        artworks.url,
        first_release_date,
        platforms.name,
        genres.name,
        involved_companies.company.name,
        rating,
        summary,
        game_type;

      where 
        cover != null
        & first_release_date != null
        & first_release_date <= ${now}
        & game_type != 5
        & game_type != 6
        & game_type != 7;

      sort first_release_date desc;

      limit ${limit};
      offset ${offset};
    `,
  });

  const results = await response.json();

  const countResponse = await fetch('https://api.igdb.com/v4/games/count', {
    method: 'POST',
    headers: {
      'Client-ID': process.env.IGDB_CLIENT_ID,
      Authorization: `Bearer ${token}`,
    },
    body: `
      where 
        cover != null
        & first_release_date != null
        & first_release_date <= ${now}
        & game_type != 5
        & game_type != 6
        & game_type != 7;
    `,
  });

  const countData = await countResponse.json();

  return {
    results,
    total: countData.count || 0,
  };
}

export async function searchGameByName(name, limit = 50, offset = 0) {
  const token = await getAccessToken();
  const now = Math.floor(Date.now() / 1000);

  const response = await fetch('https://api.igdb.com/v4/games', {
    method: 'POST',
    headers: {
      'Client-ID': process.env.IGDB_CLIENT_ID,
      Authorization: `Bearer ${token}`,
    },
    body: `
      fields 
        name,
        cover.url,
        screenshots.url,
        artworks.url,
        first_release_date,
        platforms.name,
        genres.name,
        involved_companies.company.name,
        rating,
        summary,
        game_type;

      search "${name}";

      where 
        first_release_date != null
        & first_release_date <= ${now}
        & cover != null
        & game_type != 5
        & game_type != 6
        & game_type != 7;

      limit ${limit};
      offset ${offset};
    `,
  });

  const results = await response.json();

  const countResponse = await fetch('https://api.igdb.com/v4/games/count', {
    method: 'POST',
    headers: {
      'Client-ID': process.env.IGDB_CLIENT_ID,
      Authorization: `Bearer ${token}`,
    },
    body: `
      search "${name}";

      where 
        first_release_date != null
        & first_release_date <= ${now}
        & cover != null
        & game_type != 5
        & game_type != 6
        & game_type != 7;
    `,
  });

  const countData = await countResponse.json();

  return {
    results,
    total: countData.count || 0,
  };
}
