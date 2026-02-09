export async function searchGameStores(lat, lng, radius, types) {
  const blocks = types
    .map(
      (type) => `
        node["shop"="${type}"](around:${radius},${lat},${lng});
        way["shop"="${type}"](around:${radius},${lat},${lng});
      `,
    )
    .join('');

  const query = `
    [out:json];
    (${blocks});
    out center tags 50;
  `;

  const res = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    body: query,
  });

  return (await res.json()).elements;
}
