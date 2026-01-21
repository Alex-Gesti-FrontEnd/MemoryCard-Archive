export async function reverseGeocodeOSM(lat, lng) {
  const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`;

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'video-games-management/1.0 (alexgesti@gmail.com)',
    },
  });

  const data = await response.json();

  return {
    address: data.display_name,
    country: data.address?.country,
    city: data.address?.city || data.address?.town || data.address?.village,
  };
}
