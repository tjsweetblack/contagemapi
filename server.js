const express = require("express");
const cors = require("cors");
// Import the Vercel Postgres SDK
const { sql } = require("@vercel/postgres");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Function to create the table if it doesn't exist
// This is a one-time operation, but it's good practice to ensure the table exists
async function setupDatabase() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS historicos (
        id SERIAL PRIMARY KEY,
        lingua VARCHAR(255) NOT NULL,
        data VARCHAR(255) NOT NULL,
        rank VARCHAR(255)
      );
    `;
    console.log("Database table 'historicos' is ready.");
  } catch (err) {
    console.error("Failed to set up database:", err);
  }
}

// Immediately call the setup function
setupDatabase();

// POST endpoint to add a new historical record
app.post("/historico", async (req, res) => {
  try {
    const { lingua, data, rank } = req.body;

    if (!lingua || !data) {
      return res.status(400).json({ error: "Informe lingua e data." });
    }

    // Insert data into the database
    const result = await sql`
      INSERT INTO historicos (lingua, data, rank)
      VALUES (${lingua}, ${data}, ${rank})
      RETURNING *;
    `;

    const novoHistorico = result.rows[0];
    res.json({ message: "Histórico adicionado!", historico: novoHistorico });
  } catch (err) {
    console.error("Error inserting data:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// GET endpoint to retrieve all historical records
app.get("/historico", async (req, res) => {
  try {
    const { rows } = await sql`SELECT * FROM historicos ORDER BY id ASC;`;
    res.json(rows);
  } catch (err) {
    console.error("Error fetching data:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// GET endpoint for statistics
app.get("/estatisticas", async (req, res) => {
  try {
    const totalResult = await sql`SELECT COUNT(*) FROM historicos;`;
    const total = parseInt(totalResult.rows[0].count, 10);

    const linguaCountResult = await sql`
      SELECT lingua, COUNT(*) AS count
      FROM historicos
      GROUP BY lingua;
    `;

    const porLingua = linguaCountResult.rows.reduce((acc, item) => {
      acc[item.lingua] = parseInt(item.count, 10);
      return acc;
    }, {});

    res.json({
      total,
      porLingua,
    });
  } catch (err) {
    console.error("Error generating statistics:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});