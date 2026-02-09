export async function reverseGeocodeOSM(lat, lng) {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
    {
      headers: { 'User-Agent': 'video-games-management/1.0 (alexgesti@gmail.com)' },
    },
  );

  const data = await res.json();

  return {
    address: data.display_name,
    country: data.address?.country,
    city: data.address?.city || data.address?.town || data.address?.village,
  };
}
