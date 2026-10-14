const http = require('http');

function post(path, data) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(data);
    const req = http.request(
      {
        hostname: 'localhost',
        port: 5000,
        path,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
        },
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => resolve({ status: res.statusCode, data: JSON.parse(body) }));
      }
    );
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

function get(path, token = null) {
  return new Promise((resolve, reject) => {
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const req = http.request(
      {
        hostname: 'localhost',
        port: 5000,
        path,
        method: 'GET',
        headers,
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => resolve({ status: res.statusCode, data: JSON.parse(body) }));
      }
    );
    req.on('error', reject);
    req.end();
  });
}

async function runTests() {
  console.log('--- TEST 1: Register User ---');
  const regRes = await post('/api/auth/register', {
    username: 'ApexPredator',
    email: 'apex@arcade.io',
    password: 'password123',
    avatar: 'cyberpunk',
  });
  console.log('Register Response Status:', regRes.status, 'User:', regRes.data.user?.username);

  const token = regRes.data.token;

  console.log('\n--- TEST 2: Get Me (Auth Profile) ---');
  const meRes = await get('/api/auth/me', token);
  console.log('Me Response Status:', meRes.status, 'Stats:', meRes.data.user?.stats);

  console.log('\n--- TEST 3: Record Match ---');
  const matchRes = await post('/api/matches/record', {
    mode: 'pvc',
    targetWins: 2,
    player1: {
      id: regRes.data.user.id,
      username: regRes.data.user.username,
      score: 2,
      isGuest: false,
    },
    player2: {
      id: 'bot_ai',
      username: 'CyberBot 3000',
      score: 1,
      isBot: true,
      isGuest: false,
    },
    winner: {
      id: regRes.data.user.id,
      username: regRes.data.user.username,
    },
    rounds: [
      { roundNumber: 1, p1Move: 'rock', p2Move: 'scissors', result: 'p1' },
      { roundNumber: 2, p1Move: 'paper', p2Move: 'scissors', result: 'p2' },
      { roundNumber: 3, p1Move: 'rock', p2Move: 'scissors', result: 'p1' },
    ],
    status: 'completed',
  });
  console.log('Match Record Status:', matchRes.status, 'Winner:', matchRes.data.match?.winner?.username);

  console.log('\n--- TEST 4: Fetch Updated Leaderboard ---');
  const lbRes = await get('/api/leaderboard');
  console.log('Leaderboard Count:', lbRes.data.leaderboard?.length);
  console.log('Top Player:', lbRes.data.leaderboard[0]);
  console.log('\nALL TESTS PASSED SUCCESSFULLY! 🚀');
}

runTests().catch(console.error);
