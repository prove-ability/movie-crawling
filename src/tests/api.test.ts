import request from "supertest";
import app from "../index";

describe("TEST START", () => {
  it("GET /movies - 영화 불러오기", async () => {
    const result = await request(app).get("/movies");
    expect(result.statusCode).toEqual(200);
  });
  afterAll((done) => {
    done();
  });
});
