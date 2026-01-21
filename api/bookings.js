import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
  const sql = neon(process.env.DATABASE_URL);

  if (req.method === 'GET') {
    try {
      const bookings = await sql`SELECT * FROM bookings ORDER BY date DESC`;
      return res.status(200).json(bookings);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  if (req.method === 'POST') {
    const { member_id, session_key, date, type } = req.body;
    try {
      const result = await sql`
        INSERT INTO bookings (member_id, session_key, date, type, attended)
        VALUES (${member_id}, ${session_key}, ${date}, ${type}, false)
        RETURNING *
      `;
      return res.status(201).json(result[0]);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  if (req.method === 'DELETE') {
    const { id } = req.body;
    try {
      await sql`DELETE FROM bookings WHERE id = ${id}`;
      return res.status(200).json({ success: true });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}