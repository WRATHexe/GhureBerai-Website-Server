const express= require('express');
const cors= require('cors');
const app = express();
const port =  process.env.PORT || 5000;
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config();
app.use(cors());
app.use(express.json());




const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.esy9tcr.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    // Database and collection setup
    const collection = client.db("TourBuzzDB").collection("tourPackagesCollection");

    app.post('/tourPackages', async (req, res) => {
        try {
            const tourPackage = req.body;
            const result = await collection.insertOne(tourPackage);
            res.send(result);
        } catch (error) {
            res.status(500).send({ error: 'Failed to add tour package' });
        }
    });

    app.get('/tourPackages', async (req, res) => {
      const { search } = req.query;
      let query = {};
      if (search) {
      query = {
        $or: [
        { tourName: { $regex: search, $options: "i" } },
        { destination: { $regex: search, $options: "i" } }
        ]
      };
      }
      try {
      const packages = await collection.find(query).toArray();
      res.json(packages);
      } catch (error) {
      res.status(500).send({ error: 'Failed to fetch tour packages' });
      }
    });


    









    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    //await client.close();
  }
}
run().catch(console.dir);



app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.listen(port, () => {
  console.log(`TourBuzz Server is running on http://localhost:${port}`);
});

