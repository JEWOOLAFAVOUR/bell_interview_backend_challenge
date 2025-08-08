import request from "supertest";
import app from "../app";

describe("Basic App Tests", () => {
  it("should return health status", async () => {
    const response = await request(app).get("/health").expect(200);

    expect(response.body).toEqual(
      expect.objectContaining({
        status: "ok",
        timestamp: expect.any(String),
        environment: "test",
      })
    );
  });

  it("should return 404 for unknown routes", async () => {
    const response = await request(app).get("/unknown-route").expect(404);

    expect(response.body).toEqual({
      success: false,
      error: "Route not found",
    });
  });
});
