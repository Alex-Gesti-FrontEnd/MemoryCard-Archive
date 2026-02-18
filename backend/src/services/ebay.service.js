import dotenv from 'dotenv';
dotenv.config();

let cachedToken = null;
let tokenExpiresAt = 0;

async function getEbayToken() {
  if (cachedToken && Date.now() < tokenExpiresAt) {
    return cachedToken;
  }

  const response = await fetch('https://api.ebay.com/identity/v1/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization:
        'Basic ' +
        Buffer.from(`${process.env.EBAY_CLIENT_ID}:${process.env.EBAY_CLIENT_SECRET}`).toString(
          'base64',
        ),
    },
    body: 'grant_type=client_credentials&scope=https://api.ebay.com/oauth/api_scope',
  });

  const data = await response.json();

  cachedToken = data.access_token;
  tokenExpiresAt = Date.now() + data.expires_in * 1000;

  return cachedToken;
}

async function getExchangeRate(fromCurrency) {
  if (fromCurrency === 'EUR') return 1;

  const res = await fetch(`https://open.er-api.com/v6/latest/${fromCurrency}`);

  const data = await res.json();

  if (data.result !== 'success') return null;

  return data.rates?.EUR ?? null;
}

export async function getAveragePrice(query) {
  const token = await getEbayToken();

  let offset = 0;
  const limit = 200;
  const maxItems = 800;

  let allItems = [];

  while (offset < maxItems) {
    const response = await fetch(
      `https://api.ebay.com/buy/browse/v1/item_summary/search?q=${encodeURIComponent(
        query,
      )}&limit=${limit}&offset=${offset}&filter=buyingOptions:{FIXED_PRICE}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    const data = await response.json();

    if (!data.itemSummaries?.length) break;

    allItems.push(...data.itemSummaries);

    if (data.itemSummaries.length < limit) break;

    offset += limit;
  }

  if (!allItems.length) return null;

  const currencies = [...new Set(allItems.map((item) => item.price?.currency).filter((c) => c))];

  const exchangeRates = {};

  for (const currency of currencies) {
    const rate = await getExchangeRate(currency);
    if (rate) {
      exchangeRates[currency] = rate;
    }
  }

  const eurPrices = allItems
    .map((item) => {
      const value = Number(item.price?.value);
      const currency = item.price?.currency;

      if (value == null || currency == null) return null;

      const rate = exchangeRates[currency];
      if (!rate) return null;

      return value * rate;
    })
    .filter((p) => p && !isNaN(p));

  if (!eurPrices.length) return null;

  const sorted = eurPrices.sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);

  const median = sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;

  return {
    median: Number(median.toFixed(2)),
    count: eurPrices.length,
    currency: 'EUR',
  };
}
