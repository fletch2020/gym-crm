import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
  const sql = neon(process.env.DATABASE_URL);

  if (req.method === 'GET') {
    try {
      const members = await sql`SELECT * FROM members`;
      return res.status(200).json(members);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  if (req.method === 'POST') {
    const { name, email, password, phone } = req.body;
    try {
      const result = await sql`
        INSERT INTO members (name, email, password, phone, credits, is_admin, joined)
        VALUES (${name}, ${email}, ${password}, ${phone}, 0, false, TO_CHAR(CURRENT_DATE, 'YYYY-MM'))
        RETURNING *
      `;
      return res.status(201).json(result[0]);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  if (req.method === 'PUT') {
    const { id, credits } = req.body;
    try {
      await sql`UPDATE members SET credits = ${credits} WHERE id = ${id}`;
      return res.status(200).json({ success: true });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}