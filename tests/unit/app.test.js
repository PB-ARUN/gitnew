
const request = require('supertest');
const app = require('../../src/app');

describe('TODO API', () => {
  test('GET /health returns healthy status', async () => {
    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok' });
  });

  test('GET /api/todos returns an array', async () => {
    const response = await request(app).get('/api/todos');

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });

  test('POST /api/todos creates a task', async () => {
    const response = await request(app)
      .post('/api/todos')
      .send({ title: 'Verify flight schedule' });

    expect(response.status).toBe(201);
    expect(response.body.title).toBe('Verify flight schedule');
    expect(response.body.done).toBe(false);
    expect(response.body.id).toBeDefined();
  });

  test('POST rejects an empty title', async () => {
    const response = await request(app)
      .post('/api/todos')
      .send({ title: '   ' });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('title is required');
  });

  test('PUT toggles a task to completed', async () => {
    const created = await request(app)
      .post('/api/todos')
      .send({ title: 'Check aircraft maintenance' });

    const response = await request(app)
      .put(`/api/todos/${created.body.id}/toggle`);

    expect(response.status).toBe(200);
    expect(response.body.done).toBe(true);
  });

  test('DELETE removes an existing task', async () => {
    const created = await request(app)
      .post('/api/todos')
      .send({ title: 'Review departure checklist' });

    const response = await request(app)
      .delete(`/api/todos/${created.body.id}`);

    expect(response.status).toBe(204);
  });
});
