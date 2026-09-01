import { test, expect } from '@playwright/test';

test.describe('Movies API', () => {

  test('should return a valid list of movies', async ({ request }) => {
    const response = await request.get(
      'http://localhost:8080/v1/proxy/movies/'
    );

    expect(response.status()).toBe(200);

    const movies = await response.json();

    expect(Array.isArray(movies)).toBeTruthy();
    expect(movies.length).toBeGreaterThan(0);

    const movie = movies[0];

    expect(movie).toEqual(
      expect.objectContaining({
        title: expect.any(String),
        imdb: expect.any(String),
        type: expect.any(String),
        year: expect.any(Number),
        description: expect.any(String),
        image: expect.any(String),
      })
    );
  });

});