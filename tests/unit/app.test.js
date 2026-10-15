
const request = require('supertest');
const app = require('../../src/app');

describe('TODO application API', () => {
  test('health endpoint returns status ok', async () => {
    const response = await request(app).get('/health');

    expect(response.statusCode).toBe(200);
    expect(response.body.status).toBe('ok');
  });

  test('creates a TODO successfully', async () => {
    const response = await request(app)
      .post('/api/todos')
      .send({ title: 'Verify flight schedule' });

    expect(response.statusCode).toBe(201);
    expect(response.body.title).toBe('Verify flight schedule');
    expect(response.body.done).toBe(false);
    expect(response.body.id).toBeDefined();
  });

  test('rejects a TODO without a title', async () => {
    const response = await request(app)
      .post('/api/todos')
      .send({ title: '   ' });

    expect(response.statusCode).toBe(400);
    expect(response.body.error).toBe('title is required');
  });

  test('returns the TODO list', async () => {
    const response = await request(app).get('/api/todos');

    expect(response.statusCode).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });
});
