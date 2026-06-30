(async () => {
  try {
    const base = 'http://localhost:5001/api';
    const email = 'dev+test@localhost';
    const password = 'Password123!';
    const fullName = 'Dev Tester';

    async function post(path, body) {
      const res = await fetch(base + path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const text = await res.text();
      try {
        return { ok: res.ok, json: JSON.parse(text) };
      } catch (e) {
        return { ok: res.ok, text };
      }
    }

    let r = await post('/auth/login', { email, password });
    if (!r.ok) {
      r = await post('/auth/register', { email, password, fullName });
    }

    if (!r.ok) {
      console.error('Auth failed', r);
      process.exit(1);
    }

    const payload = r.json && r.json.data ? r.json.data : r.json || r.text;
    console.log(JSON.stringify(payload));
  } catch (err) {
    console.error('Script error', String(err));
    process.exit(1);
  }
})();
