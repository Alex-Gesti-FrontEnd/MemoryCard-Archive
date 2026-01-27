export async function searchGameStores(lat, lng) {
  const query = `
    [out:json];
    (
      node["shop"="video_games"](around:20000, ${lat}, ${lng});
      way["shop"="video_games"](around:20000, ${lat}, ${lng});
      
      node["shop"="electronics"](around:20000, ${lat}, ${lng});
      way["shop"="electronics"](around:20000, ${lat}, ${lng});
      
      node["shop"="computer"](around:20000, ${lat}, ${lng});
      way["shop"="computer"](around:20000, ${lat}, ${lng});
      
      node["shop"="department_store"](around:20000, ${lat}, ${lng});
      way["shop"="department_store"](around:20000, ${lat}, ${lng});
      
      node["shop"="shopping_centre"](around:20000, ${lat}, ${lng});
      way["shop"="shopping_centre"](around:20000, ${lat}, ${lng});
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
