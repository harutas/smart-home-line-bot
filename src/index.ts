import { Hono } from 'hono';
import webhook from './routes/webhook';

const app = new Hono<{ Bindings: Env }>();

app.route('/webhook', webhook);

export default app;
