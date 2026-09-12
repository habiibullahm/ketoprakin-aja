const http = require('http');

const data = JSON.stringify({
  customerName: "Budi Santoso",
  items: [{
    menuId: 1,
    quantity: 2,
    spiceLevel: 5,
    garlicAmount: "normal",
    sauceConsistency: "pas"
  }],
  orderType: "pickup",
  paymentMethod: "qris"
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/orders',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, (res) => {
  let responseData = '';
  res.on('data', (chunk) => { responseData += chunk; });
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Response:', responseData);
  });
});

req.on('error', (e) => { console.error('Error:', e.message); });
req.write(data);
req.end();
