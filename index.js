const express= require('express');
const cors= require('cors');
const app = express();
const port =  process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
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
    const packageCollection = client.db("TourBuzzDB").collection("tourPackagesCollection");
    const bookingCollection = client.db("TourBuzzDB").collection("bookingCollection");
    // retrieve all tour packages with search functionality
// Filter by guideEmail and search
    app.get('/tourPackages', async (req, res) => {
      const { guideEmail, search } = req.query;
      let query = {};
      if (guideEmail) query.guideEmail = guideEmail;
      if (search) {
        query.$or = [
          { tourName: { $regex: search, $options: "i" } },
          { destination: { $regex: search, $options: "i" } }
        ];
      }
      try {
        const packages = await packageCollection.find(query).toArray();
        res.json(packages);
      } catch {
        res.status(500).send({ error: 'Failed to fetch tour packages' });
      }
    });
    app.get('/tourPackages/:id', async (req, res) => {
      const id = req.params.id;
      try {
        const packageData = await packageCollection.findOne({ _id: new ObjectId(id) });
        if (packageData) {
          res.json(packageData);
        } else {
          res.status(404).send({ error: 'Tour package not found' });
        }
      } catch (error) {
        res.status(500).send({ error: 'Failed to fetch tour package' });
      }
    });

    app.get('/bookings', async (req, res) => {
      const { userEmail } = req.query;
      let query = {};
      if (userEmail) query.buyerEmail = userEmail;
      try {
        const bookings = await bookingCollection.find(query).toArray();
        res.json(bookings);
      } catch {
        res.status(500).send({ error: 'Failed to fetch bookings' });
      }
    });

    app.post('/tourPackages', async (req, res) => {
      try {
          const tourPackage = req.body;
          const result = await packageCollection.insertOne(tourPackage);
          res.send(result);
      } catch (error) {
          res.status(500).send({ error: 'Failed to add tour package' });
      }
    });
    app.post('/bookings', async (req, res) => {
      try {
        const booking = req.body;
        const result = await bookingCollection.insertOne(booking);
        res.send(result);
      } catch (error) {
        res.status(500).send({ error: 'Failed to add booking' });
      }
    });

    // Update a tour package
app.put('/tourPackages/:id', async (req, res) => {
  const { id } = req.params;
  const updateDoc = { $set: req.body };
  try {
    await collection.updateOne(
      { _id: new ObjectId(id) },
      updateDoc
    );
    const updated = await packageCollection.findOne({ _id: new ObjectId(id) });
    res.send(updated);
  } catch {
    res.status(500).send({ error: 'Failed to update package' });
  }
});

// Delete a tour package
app.delete('/tourPackages/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await packageCollection.deleteOne({ _id: new ObjectId(id) });
    res.send({ success: true });
  } catch {
    res.status(500).send({ error: 'Failed to delete package' });
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

