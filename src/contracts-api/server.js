import 'dotenv/config';
import app from './app.js';

const { PORT = 3001 } = process.env;

app.listen(Number(PORT), () => {
  console.log(`AdVault API rodando em http://localhost:${PORT}`);
});
