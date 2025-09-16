import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { errorHandler } from './middleware/error.js';

import advaultRoutes from './routes/advault.js';
import campaignRoutes from './routes/campaigns.js';
import eventRoutes from './routes/events.js';
import registryRoutes from './routes/registry.js';
import tokenRoutes from './routes/token.js';

const app = express();
app.use(helmet());
app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));

app.get('/healthz', (req, res) => res.json({ ok: true }));

app.use('/v1/advault', advaultRoutes);
app.use('/v1/campaigns', campaignRoutes);
app.use('/v1/events', eventRoutes);
app.use('/v1/registry', registryRoutes);
app.use('/v1/token', tokenRoutes);

app.use(errorHandler);

export default app;
