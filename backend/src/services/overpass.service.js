export async function searchGameStores(lat, lng) {
  const query = `
    [out:json];
    (
      node["shop"="video_games"](around:15000, ${lat}, ${lng});
      way["shop"="video_games"](around:15000, ${lat}, ${lng});
    );
    out center;
  `;

  const res = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    body: query,
  });

  const data = await res.json();
  return data.elements;
}
