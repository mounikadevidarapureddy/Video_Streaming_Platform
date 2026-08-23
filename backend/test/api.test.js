import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { initDB } from '../config/db.js';
import { app, server } from '../server.js';

let baseUrl;
let authToken;
let uploadedVideoId;

before(async () => {
  await initDB();
  await new Promise((resolve) => server.listen(0, resolve));
  const address = server.address();
  baseUrl = `http://127.0.0.1:${address.port}`;
});

after(async () => {
  if (uploadedVideoId && authToken) {
    await fetch(`${baseUrl}/api/videos/${uploadedVideoId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${authToken}` }
    });
  }
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
});

const jsonRequest = async (path, options = {}) => {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) }
  });
  return { response, body: await response.json() };
};

describe('FLIXIT backend API', () => {
  it('reports a healthy service', async () => {
    const { response, body } = await jsonRequest('/api/health');
    assert.equal(response.status, 200);
    assert.equal(body.status, 'online');
  });

  it('authenticates the demo creator', async () => {
    const { response, body } = await jsonRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'admin@flixit.com', password: 'password' })
    });
    assert.equal(response.status, 200);
    assert.equal(typeof body.token, 'string');
    authToken = body.token;
  });

  it('serves all local catalog videos', async () => {
    const { response, body } = await jsonRequest('/api/videos');
    assert.equal(response.status, 200);
    assert.ok(body.videos.length > 0);
    assert.ok(body.videos.every((video) => video.raw_url.startsWith('/videos/')));

    const mediaResponse = await fetch(`${baseUrl}${body.videos[0].raw_url}`);
    assert.equal(mediaResponse.status, 200);
    assert.match(mediaResponse.headers.get('content-type') || '', /video|octet-stream/);
  });

  it('uploads and deletes a video for an authenticated creator', async () => {
    const form = new FormData();
    form.append('video', new Blob(['test video content'], { type: 'video/mp4' }), 'test-upload.mp4');
    form.append('title', 'Automated Upload Test');
    form.append('description', 'Created by the API test suite');
    form.append('category', 'Test');

    const uploadResponse = await fetch(`${baseUrl}/api/videos/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${authToken}` },
      body: form
    });
    const uploadBody = await uploadResponse.json();
    assert.equal(uploadResponse.status, 201);
    uploadedVideoId = uploadBody.video.id;

    const deleteResponse = await fetch(`${baseUrl}/api/videos/${uploadedVideoId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${authToken}` }
    });
    assert.equal(deleteResponse.status, 200);
    uploadedVideoId = undefined;

    const { body } = await jsonRequest('/api/videos');
    assert.ok(body.videos.length > 0);
    assert.equal(body.videos.some((video) => video.title === 'Automated Upload Test'), false);
  });
});
