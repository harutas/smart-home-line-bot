import webhook from '@/routes/webhook';
import { Hono } from 'hono';

const app = new Hono<{ Bindings: Env }>();

app.route('/webhook', webhook);

export default app;
