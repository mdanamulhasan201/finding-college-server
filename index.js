const express = require("express");
const app = express();
const cors = require("cors");
const { MongoClient, ObjectId } = require("mongodb");
require("dotenv").config();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.kjjf84i.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  serverApi: {
    version: "1",
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server (optional starting in v4.7)
    await client.connect();

    const collegeCollection = client.db("collegeFinding").collection("college");

    const indexKeys = { carName: 1, category: 1 };
    // Create index and wait for it to finish
    await collegeCollection.createIndex(indexKeys);

    // Route to get all colleges
    app.get("/collegeList", async (req, res) => {
      const result = await collegeCollection.find({}).sort({ createdAt: -1 }).toArray();
      res.send(result);
    });

    // Route to search colleges by text
    app.get("/collegeSearch/:text", async (req, res) => {
      const searchText = req.params.text;
      const result = await collegeCollection
        .find({
          $or: [
            { college: { $regex: searchText, $options: "i" } },
            { researchHistory: { $regex: searchText, $options: "i" } },
          ],
        })
        .toArray();
      res.send(result);
    });

    // Route to get college details by ID
    app.get("/collegeDetails/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };

      try {
        const result = await collegeCollection.findOne(filter);

        if (!result) {
          return res.status(404).json({ error: "College not found" });
        }

        res.json(result);
      } catch (error) {
        console.error("Error fetching college details:", error);
        res.status(500).json({ error: "Internal server error" });
      }
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
  } finally {
    // Close the client when finished
    // await client.close();
  }
}

run().catch(console.dir);

app.listen(port, () => {
  console.log(`Server connected on port ${port}`);
});
