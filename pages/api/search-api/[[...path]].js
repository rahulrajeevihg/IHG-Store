export default async function handler(req, res) {
  const { path } = req.query;
  const searchPath = Array.isArray(path) ? path.join('/') : path || '';
  const queryString = req.url.includes('?') ? '?' + req.url.split('?')[1] : '';

  try {
    const typesenseUrl = `https://search.ihgind.com/${searchPath}${queryString}`;

    const headers = {
      'Content-Type': 'application/json',
      'x-typesense-api-key': process.env.TYPESENSE_API_KEY || 'gjbRIS6NQkArF5lJx08U7bVJgg8beTIFFvQVBf7xdKiIWNb8',
    };

    const fetchOptions = {
      method: req.method,
      headers,
    };

    if (req.method !== 'GET' && req.method !== 'HEAD') {
      fetchOptions.body = JSON.stringify(req.body);
    }

    const response = await fetch(typesenseUrl, fetchOptions);
    const data = await response.json();

    res.status(response.status).json(data);
  } catch (error) {
    console.error('Search API proxy error:', error);
    res.status(500).json({ error: error.message });
  }
}
