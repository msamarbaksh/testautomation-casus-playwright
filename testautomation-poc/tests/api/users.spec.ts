import { test, expect } from '@playwright/test';

test.describe('Users API', () => {

  test('should create a new user', async ({ request }) => {
    const username = `testuser_${Date.now()}`;
    const password = 'Test123!';

    const response = await request.post(
      'http://localhost:8080/v1/proxy/users/',
      {
        data: {
          username,
          password,
        },
      }
    );

    expect(response.status()).toBe(200);

    const user = await response.json();

    expect(user).toEqual(
      expect.objectContaining({
        active: true,
        id: expect.any(Number),
        role: 'user',
        username,
      })
    );
  });

});

test('should reject a duplicate username', async ({ request }) => {
  const username = `duplicate_${Date.now()}`;
  const password = 'Test123!';

  const firstResponse = await request.post(
    'http://localhost:8080/v1/proxy/users/',
    {
      data: {
        username,
        password,
      },
    }
  );

  expect(firstResponse.status()).toBe(200);

  const duplicateResponse = await request.post(
    'http://localhost:8080/v1/proxy/users/',
    {
      data: {
        username,
        password,
      },
    }
  );

  expect(duplicateResponse.status()).toBe(400);

  const error = await duplicateResponse.json();

  expect(error.Error).toContain('already exists');
});