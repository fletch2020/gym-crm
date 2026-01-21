import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const sql = neon(process.env.DATABASE_URL);
  const { email, password } = req.body;

  try {
    const result = await sql`
      SELECT * FROM members WHERE email = ${email} AND password = ${password}
    `;

    if (result.length > 0) {
      const user = {
        ...result[0],
        credits: parseFloat(result[0].credits) || 0
      };
      return res.status(200).json(user);
    } else {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
