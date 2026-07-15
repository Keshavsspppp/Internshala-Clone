const test = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");
process.env.NODE_ENV = "test";
const { app } = require("../index");

test("backend root and security headers are production-safe", async () => {
  const response = await request(app).get("/").expect(200);
  assert.equal(response.body.message, "InternArea backend is running.");
  assert.equal(response.headers["x-powered-by"], undefined);
  assert.equal(response.headers["x-content-type-options"], "nosniff");
});

test("health endpoint reports boolean readiness checks without exposing secrets", async () => {
  const response = await request(app).get("/health");
  assert.ok([200, 503].includes(response.status));
  assert.ok(["ready", "not_ready"].includes(response.body.status));
  for (const value of Object.values(response.body.checks)) assert.equal(typeof value, "boolean");
});

test("protected endpoints reject unauthenticated requests", async () => {
  const response = await request(app).get("/api/community/feed").expect(401);
  assert.match(response.body.error, /Unauthorized|verified/i);
});

test("development CORS allows the local frontend and rejects unknown origins", async () => {
  const allowed = await request(app)
    .options("/api/community/feed")
    .set("Origin", "http://localhost:3000")
    .set("Access-Control-Request-Method", "GET")
    .expect(200);
  assert.equal(allowed.headers["access-control-allow-origin"], "http://localhost:3000");

  const denied = await request(app)
    .options("/api/community/feed")
    .set("Origin", "https://evil.example")
    .set("Access-Control-Request-Method", "GET");
  assert.equal(denied.headers["access-control-allow-origin"], undefined);
});
