const express = require("express");
const cors = require("cors");
const admin = require("firebase-admin");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Initialize Firebase Admin SDK
// Use the environment variable for credentials in production on Vercel
try {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
} catch (error) {
  console.error("Firebase initialization failed:", error);
}

const db = admin.firestore();

// POST endpoint to add a new historical record
app.post("/historico", async (req, res) => {
  try {
    const { lingua, data, rank } = req.body;

    if (!lingua || !data) {
      return res.status(400).json({ error: "Informe lingua e data." });
    }

    const novoHistorico = {
      lingua,
      data,
      rank,
      timestamp: admin.firestore.FieldValue.serverTimestamp(), // Add a server-side timestamp
    };

    // Add a new document to the 'historicos' collection
    const docRef = await db.collection("historicos").add(novoHistorico);

    res.status(201).json({
      message: "Histórico adicionado!",
      id: docRef.id,
      historico: novoHistorico,
    });
  } catch (err) {
    console.error("Error adding document: ", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// GET endpoint to retrieve all historical records
app.get("/historico", async (req, res) => {
  try {
    const historicosRef = db.collection("historicos");
    const snapshot = await historicosRef.get();

    const historicos = [];
    snapshot.forEach((doc) => {
      historicos.push({ id: doc.id, ...doc.data() });
    });

    res.json(historicos);
  } catch (err) {
    console.error("Error fetching documents: ", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// GET endpoint for statistics
app.get("/estatisticas", async (req, res) => {
  try {
    const historicosRef = db.collection("historicos");
    const snapshot = await historicosRef.get();

    const total = snapshot.size;

    const porLingua = {};
    snapshot.forEach((doc) => {
      const data = doc.data();
      porLingua[data.lingua] = (porLingua[data.lingua] || 0) + 1;
    });

    res.json({
      total,
      porLingua,
    });
  } catch (err) {
    console.error("Error fetching statistics: ", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});