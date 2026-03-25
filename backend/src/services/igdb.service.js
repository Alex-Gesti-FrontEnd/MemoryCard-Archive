import dotenv from 'dotenv';
import { filter } from 'rxjs';

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

export async function getPopularGames(limit = 50, offset = 0, filters = {}) {
  const token = await getAccessToken();
  const now = Math.floor(Date.now() / 1000);

  const whereClause = buildWhere(filters, now);

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
        release_dates.date,
        release_dates.platform.name,
        platforms.name,
        genres.name,
        involved_companies.company.name,
        rating,
        summary,
        slug,
        game_type;

      where 
        ${whereClause};

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

  const mappedResults = results.map((g) => ({
    ...g,
    main_platform: getMainPlatform(g),
  }));

  return {
    results: mappedResults,
    total: countData.count || 0,
  };
}

export async function searchGameByName(name, limit = 50, offset = 0, filters = {}) {
  const token = await getAccessToken();
  const now = Math.floor(Date.now() / 1000);
  const whereClause = buildWhere(filters, now);

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
        release_dates.date,
        release_dates.platform.name,
        platforms.name,
        genres.name,
        involved_companies.company.name,
        rating,
        summary,
        slug,
        game_type;

      search "${name}";

      where 
        ${whereClause};

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

  const mappedResults = results.map((g) => ({
    ...g,
    main_platform: getMainPlatform(g),
  }));

  return {
    results: mappedResults,
    total: countData.count || 0,
  };
}

export async function getPlatforms() {
  const token = await getAccessToken();

  const response = await fetch('https://api.igdb.com/v4/platforms', {
    method: 'POST',
    headers: {
      'Client-ID': process.env.IGDB_CLIENT_ID,
      Authorization: `Bearer ${token}`,
    },
    body: `
      fields id, name;
      limit 200;
      sort name asc;
    `,
  });

  return await response.json();
}

function getMainPlatform(game) {
  if (!game.release_dates || game.release_dates.length === 0) {
    return game.platforms?.[0] || null;
  }

  const validReleases = game.release_dates.filter((r) => r.platform && r.date);

  if (validReleases.length === 0) {
    return game.platforms?.[0] || null;
  }

  const sorted = validReleases.sort((a, b) => a.date - b.date);

  return sorted[0].platform || null;
}

function buildWhere(filters, now) {
  let where = `
    first_release_date != null
    & first_release_date <= ${now}
    & cover != null
    & game_type != 5
    & game_type != 6
    & game_type != 7
  `;

  if (filters.platforms) {
    const map = {
      PC: 6,
      PS5: 167,
      PS4: 48,
      PS3: 9,
      PS2: 8,
      PS1: 7,
      'Xbox Series': 169,
      'Xbox One': 49,
      'Xbox 360': 12,
      Xbox: 11,
      Switch: 130,
      'Wii U': 41,
      Wii: 5,
      GameCube: 21,
      'Nintendo 64': 4,
      SNES: 19,
      NES: 18,
      'Game Boy': 33,
      'Game Boy Advance': 24,
      'Nintendo DS': 20,
      'Nintendo 3DS': 37,
      PSP: 38,
      'PS Vita': 46,
    };

    const ids = filters.platforms
      .split(',')
      .map((p) => map[p])
      .filter(Boolean);

    if (ids.length > 0) {
      where += ` & platforms = (${ids.join(',')})`;
    }
  }

  if (filters.years) {
    const decade = filters.years;

    const startYear = parseInt(decade);
    const endYear = startYear + 9;

    const start = new Date(`${startYear}-01-01`).getTime() / 1000;
    const end = new Date(`${endYear}-12-31`).getTime() / 1000;

    where += ` & first_release_date >= ${start} & first_release_date <= ${end}`;
  }

  if (filters.types) {
    const map = {
      Game: 0,
      DLC: 1,
      Expansion: 2,
      Remake: 8,
      Remaster: 9,
      Expanded: 10,
      Bundle: 3,
      Port: 11,
      Fangame: 12,
    };

    const ids = filters.types
      .split(',')
      .map((t) => map[t])
      .filter((v) => v !== undefined);

    if (ids.length) {
      where += ` & game_type = (${ids.join(',')})`;
    }
  }

  return where;
}
