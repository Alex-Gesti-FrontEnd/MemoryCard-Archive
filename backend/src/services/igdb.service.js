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

export async function getPopularGames(limit = 20, offset = 0) {
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
        first_release_date,
        platforms.name;
      where 
        cover != null 
        & first_release_date != null
        & first_release_date <= ${now};
      sort first_release_date desc;
      limit ${limit};
      offset ${offset};
    `,
  });

  return response.json();
}

export async function searchGameByName(name) {
  const token = await getAccessToken();

  const response = await fetch('https://api.igdb.com/v4/games', {
    method: 'POST',
    headers: {
      'Client-ID': process.env.IGDB_CLIENT_ID,
      Authorization: `Bearer ${token}`,
    },
    body: `
      fields 
        name,
        genres.name,
        release_dates.platform.name,
        release_dates.region,
        release_dates.date,
        cover.url;
      search "${name}";
      limit 1;
    `,
  });

  const data = await response.json();
  return data[0];
}
