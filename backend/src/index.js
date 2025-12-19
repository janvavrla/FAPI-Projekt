const express = require("express");
const cors = require("cors");
const https = require("https");
const axios = require("axios");
const xml2js = require("xml2js");

const app = express();
const PORT = 4000;

app.use(cors());
app.use(express.json());

const products = [
  { id: 1, name: "Produkt A", price: 100 },
  { id: 2, name: "Produkt B", price: 200 }
];

let currentEUR = 25; // fallback

// načítání aktuálního kurzu EUR podle ČNB
async function fetchCNB() {
  console.log("Načítám aktuální kurz ČNB...");
  try {
    const agent = new https.Agent({ rejectUnauthorized: false });
    const response = await axios.get(
      "https://www.cnb.cz/cs/financni_trhy/devizovy_trh/kurzy_devizoveho_trhu/denni_kurz.xml",
      { httpsAgent: agent }
    );
    const parsed = await xml2js.parseStringPromise(response.data, { explicitArray: false });
    const radky = parsed.kurzy.tabulka.radek;
    const eur = Array.isArray(radky)
      ? radky.find(r => r.$.kod === "EUR")
      : radky.$.kod === "EUR" ? radky : null;
    if (eur) currentEUR = parseFloat(eur.$.kurz.replace(",", "."));
    console.log("Kurz EUR načten:", currentEUR);
  } catch (err) {
    console.log("Nepodařilo se načíst kurz z ČNB, použije se fallback 25 CZK/EUR");
  }
}

if (process.env.NODE_ENV !== "test") {
  fetchCNB(); // načíst kurz jen při startu serveru
}

app.get("/products", (req, res) => {
  res.json(products);
});

app.post("/order", async (req, res) => {
  const { name, street, city, zip, email, phone, productId, quantity } = req.body;
  if (!name || !street ||!city ||!zip ||!email || !phone || !productId || !quantity) {
    return res.status(400).json({ error: "Vyplňte všechna pole" });
  }

  const product = products.find(p => p.id === Number(productId));
  if (!product) return res.status(400).json({ error: "Produkt nenalezen" });

  // při testu se nebude používat fetchCNB, ale fallback(1EUR=25CZK)
  if (process.env.NODE_ENV !== "test") await fetchCNB();

  const subtotal = product.price * quantity;
  const vat = subtotal * 0.21;
  const total = (subtotal + vat);
  const totalEUR = (total / currentEUR).toFixed(2);

  res.json({
    name,
    street,
    city,
    zip,
    email,
    phone,
    product: product.name,
    quantity,
    totalCZK: (subtotal + vat),
    totalEUR
  });
});

// spustit jen pokud je main
if (require.main === module) {
  app.listen(PORT, () => console.log(`Backend běží na http://localhost:${PORT}`));
}

module.exports = app;
