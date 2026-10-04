import "dotenv/config";
import express from "express";
import { createClient } from "redis";

const app = express();

const redis = createClient({
  url: process.env.REDIS_URL,
});

redis.on("error", (error) => {
  console.log(`Redis erro: ${error}`);
});

await redis.connect();

console.log("Redis conectado");

app.get("/products/:id", async (req, res) => {
  const { id } = req.params;

  const cacheKey = `product:${id}`;

  const cachedProduct = await redis.get(cacheKey);

  if (cachedProduct) {
    console.log("Chace hit");

    return res.json({ source: "redis", data: JSON.parse(cachedProduct) });
  }

  console.log("Chace miss");

  const product = {
    id,
    name: "Mechanical keyboard",
    price: 299.99,
  };

  await redis.set(cacheKey, JSON.stringify(product), {
    EX: 40,
  });

  return res.json({
    source: "database",
    data: product,
  });
});

app.get("/users/:id", async (req, res) => {
  const { id } = req.params;

  const cacheKey = `user:${id}`;

  const cachedUsers = await redis.get(cacheKey);

  if (cachedUsers) {
    console.log("User veio do cache");
    return res.json({ source: "cache", data: JSON.parse(cachedUsers) });
  }

  console.log("Não cacheado");

  const user = {
    id,
    name: "Admin",
    role: "ADMIN",
  };

  await redis.set(cacheKey, JSON.stringify(user), {
    EX: 10,
  });

  return res.json({ source: "database", data: user });
});

app.get("/debug/products/:id", async (req, res) => {
  const { id } = req.params;

  const cachedProduct = await redis.get(`product:${id}`);

  if (cachedProduct) {
    return res.json({ data: cachedProduct });
  }

  return res.json({ data: "Nenhum produto cacheado" });
});

app.get("/debug/users/:id", async (req, res) => {
  const { id } = req.params;

  const cachedUser = await redis.get(`user:${id}`);

  if (cachedUser) {
    return res.json({ data: cachedUser });
  }

  console.log("Nenhum user cacheado");
});

app.post("/login", async (req, res) => {
  return res.json("Login in build");
});

app.listen(process.env.PORT, () => {
  console.log(`API is running on port ${process.env.PORT}`);
});
