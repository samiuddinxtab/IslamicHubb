import { buildApp } from './app.js';

const app = await buildApp();

const port = process.env.PORT ? Number(process.env.PORT) : 3000;
const host = process.env.HOST ?? '0.0.0.0';

await app.listen({ port, host });
