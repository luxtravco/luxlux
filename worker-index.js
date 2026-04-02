const jsonResponse = (data, status = 200, origin = '*') =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '*';

    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': origin,
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Max-Age': '86400'
        }
      });
    }

    if (request.method !== 'POST') {
      return jsonResponse({ ok: false, error: 'Method not allowed' }, 405, origin);
    }

    let payload;
    try {
      payload = await request.json();
    } catch (error) {
      return jsonResponse({ ok: false, error: 'Invalid JSON' }, 400, origin);
    }

    const {
      full_name,
      pickup_date,
      pickup_time,
      pickup_location,
      dropoff_location,
      travelers,
      kids,
      bags,
      contact_number
    } = payload || {};

    if (!full_name || !pickup_date || !pickup_location || !dropoff_location) {
      return jsonResponse(
        {
          ok: false,
          error: 'Missing required fields'
        },
        400,
        origin
      );
    }

    const createdAt = new Date().toISOString();

    try {
      await env.DB.prepare(
        `INSERT INTO bookings (
          full_name,
          pickup_date,
          pickup_time,
          pickup_location,
          dropoff_location,
          travelers,
          kids,
          bags,
          contact_number,
          created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(
        full_name,
        pickup_date,
        pickup_time || '',
        pickup_location,
        dropoff_location,
        travelers || '',
        kids || '',
        bags || '',
        contact_number || '',
        createdAt
      ).run();
    } catch (error) {
      return jsonResponse({ ok: false, error: 'Database error' }, 500, origin);
    }

    return jsonResponse({ ok: true }, 200, origin);
  }
};
