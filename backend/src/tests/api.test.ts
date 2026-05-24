import { describe, it, expect } from 'vitest';
import { createApp } from '../app.js';
import request from 'supertest';
import { sanitizeRichText } from '../utils/sanitize.js';

const app = createApp();

describe('API Health', () => {
  it('GET /api/v1/health returns ok', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body.code).toBe(200);
    expect(res.body.data.status).toBe('ok');
  });
});

describe('Auth validation', () => {
  it('POST /auth/register rejects invalid email', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'bad', password: '12345678' });
    expect(res.status).toBe(400);
  });

  it('POST /auth/login rejects empty body', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({});
    expect(res.status).toBe(400);
  });
});

describe('Sanitize', () => {
  it('strips script tags from HTML', () => {
    const input = '<p>Hello</p><script>alert(1)</script>';
    const output = sanitizeRichText(input);
    expect(output).not.toContain('script');
    expect(output).toContain('Hello');
  });
});

describe('Protected routes', () => {
  it('GET /diaries requires auth', async () => {
    const res = await request(app).get('/api/v1/diaries');
    expect(res.status).toBe(401);
  });
});
