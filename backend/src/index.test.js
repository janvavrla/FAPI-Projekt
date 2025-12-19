const request = require("supertest");
const express = require("express");
const app = require("./index"); 

describe("POST /order", () => {
  it("vrací správnou cenu s DPH a přepočtem EUR", async () => {
    const res = await request(app)
      .post("/order")
      .send({
        name: "Test",
        email: "test@test.cz",
        street: "test 12/5",
        city: "test",
        zip: "12345",
        phone: "+420123456789",
        productId: 1,
        quantity: 2
      }, 10000);

    expect(res.statusCode).toBe(200); // 2 * 100
    expect(res.body.totalCZK).toBe(242); // 2 * 100 + 21%
    expect(res.body.totalEUR).toBeDefined(); // musí být nějaká hodnota
  });
});
