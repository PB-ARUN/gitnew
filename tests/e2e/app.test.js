
const { test } = require('node:test');
const assert = require('node:assert/strict');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

test('application health endpoint responds successfully', async () => {
  const response = await fetch(`${BASE_URL}/health`);

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { status: 'ok' });
});

test('TODO API creates, toggles, and deletes a task', async () => {
  const created = await fetch(`${BASE_URL}/api/todos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: 'Validate runway inspection' })
  });

  assert.equal(created.status, 201);
  const todo = await created.json();
  assert.equal(todo.title, 'Validate runway inspection');
  assert.equal(todo.done, false);

  const toggled = await fetch(
    `${BASE_URL}/api/todos/${todo.id}/toggle`,
    { method: 'PUT' }
  );

  assert.equal(toggled.status, 200);
  assert.equal((await toggled.json()).done, true);

  const deleted = await fetch(`${BASE_URL}/api/todos/${todo.id}`, {
    method: 'DELETE'
  });

  assert.equal(deleted.status, 204);
});
