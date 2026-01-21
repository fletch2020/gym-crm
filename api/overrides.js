import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
  const sql = neon(process.env.DATABASE_URL);

  if (req.method === 'GET') {
    try {
      const overrides = await sql`SELECT * FROM class_overrides WHERE is_overridden = true`;
      return res.status(200).json(overrides);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  if (req.method === 'POST') {
    const { session_key, date, is_overridden } = req.body;
    try {
      if (is_overridden) {
        await sql`
          INSERT INTO class_overrides (session_key, date, is_overridden)
          VALUES (${session_key}, ${date}, true)
          ON CONFLICT (session_key, date) DO UPDATE SET is_overridden = true
        `;
      } else {
        await sql`DELETE FROM class_overrides WHERE session_key = ${session_key} AND date = ${date}`;
      }
      return res.status(200).json({ success: true });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
```

### **Step 4: Verify Your Folder Structure**

Your `gym-crm` folder should now look like:
```
gym-crm/
├── api/
│   ├── auth.js
│   ├── bookings.js
│   ├── members.js
│   └── overrides.js
├── src/
│   ├── App.jsx
│   └── main.jsx
├── index.html
├── package.json
└── vite.config.js