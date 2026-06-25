const fs = require('fs');

const envPath = '/home/vancore/vancore-backend/.env';
const envContent = `ZOHO_EMAIL=***
ZOHO_PASSWORD=***
REVOLUT_API_KEY=placeholder
`;

fs.writeFileSync(envPath, envContent);
console.log('.env created successfully');
