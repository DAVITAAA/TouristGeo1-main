fetch('http://127.0.0.1:5173/api/auth/password/forgot/initiate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'vili63@gmail.com' })
}).then(res => res.json()).then(console.log).catch(console.error);
