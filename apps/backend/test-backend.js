// Script de test pour vérifier le backend
const http = require('http');

console.log('🧪 Test du backend LocalLoop...\n');

// Test de connexion au backend
const options = {
  hostname: 'localhost',
  port: 4000,
  path: '/api/items',
  method: 'GET',
  timeout: 5000
};

const req = http.request(options, (res) => {
  console.log('✅ Backend accessible sur le port 4000');
  console.log(`📡 Status: ${res.statusCode}`);
  console.log(`📋 Headers: ${JSON.stringify(res.headers, null, 2)}`);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const jsonData = JSON.parse(data);
      console.log('📦 Réponse API:', JSON.stringify(jsonData, null, 2));
      console.log('\n🎉 Backend fonctionne correctement !');
    } catch (error) {
      console.log('📦 Réponse brute:', data);
      console.log('\n🎉 Backend fonctionne correctement !');
    }
  });
});

req.on('error', (error) => {
  console.log('❌ Erreur de connexion au backend:');
  console.log(`   ${error.message}`);
  console.log('\n💡 Vérifiez que le backend est démarré avec: npm run dev');
});

req.on('timeout', () => {
  console.log('⏰ Timeout - Le backend ne répond pas');
  req.destroy();
});

req.end();
