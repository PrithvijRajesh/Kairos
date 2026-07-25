import cors from 'cors';
import express from 'express';

import { todayDateKey } from './db';
import routes from './routes';

const app = express();
const PORT = Number(process.env.PORT ?? 3000);

app.use(cors());
app.use(express.json());
app.use('/api', routes);

app.get('/', (_req, res) => {
  res.json({
    name: 'Kairos API',
    health: '/api/health',
    today: todayDateKey(),
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Kairos API running on http://localhost:${PORT}`);
  console.log(`Today: ${todayDateKey()}`);
});
