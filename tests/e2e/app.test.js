
const test = require('node:test');
const assert = require('node:assert/strict');

const baseUrl = process.env.BASE_URL || 'http://localhost:3100';

test('application health endpoint responds successfully', async () => {
  const response = await fetch(`${baseUrl}/health`);

  assert.equal(response.status, 200);

  const body = await response.json();
  assert.equal(body.status, 'ok');
});

test('application creates and deletes a TODO', async () => {
  const title = `E2E flight check ${Date.now()}`;

  const createResponse = await fetch(`${baseUrl}/api/todos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title })
  });

  assert.equal(createResponse.status, 201);

  const todo = await createResponse.json();
  assert.equal(todo.title, title);
  assert.equal(todo.done, false);

  const deleteResponse = await fetch(
    `${baseUrl}/api/todos/${todo.id}`,
    { method: 'DELETE' }
  );

  assert.equal(deleteResponse.status, 204);
});
