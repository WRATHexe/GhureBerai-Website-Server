const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.esy9tcr.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

// Firebase Admin Setup
const admin = require("firebase-admin");
const serviceAccount = require("./firebase-adminsdk-key.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// Middleware: Verify Firebase Token
const verifyFirebaseToken = async (req, res, next) => {
  const authHeader = req.headers?.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).send({ error: 'Unauthorized access' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.decoded = decodedToken;
    next();
  } catch (error) {
    res.status(403).send({ error: 'Forbidden access' });
  }
};

async function run() {
  try {
    await client.connect();

    const packageCollection = client.db("TourBuzzDB").collection("tourPackagesCollection");
    const bookingCollection = client.db("TourBuzzDB").collection("bookingCollection");

    // 1. Public: Anyone can view/search all tour packages
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
        const packages = await packageCollection.find(query).toArray();
        res.json(packages);
      } catch (err) {
        res.status(500).send({ error: 'Failed to fetch tour packages' });
      }
    });

    // 2. Protected: Only the guide can view their own packages
    app.get('/my-tourPackages', verifyFirebaseToken, async (req, res) => {
      const tokenEmail = req.decoded?.email?.toLowerCase();
      if (!tokenEmail) {
        return res.status(403).send({ error: 'Forbidden access' });
      }
      let query = { guideEmail: tokenEmail };
      const { search } = req.query;
      if (search) {
        query = {
          $and: [
            { guideEmail: tokenEmail },
            {
              $or: [
                { tourName: { $regex: search, $options: "i" } },
                { destination: { $regex: search, $options: "i" } }
              ]
            }
          ]
        };
      }
      try {
        const packages = await packageCollection.find(query).toArray();
        res.json(packages);
      } catch {
        res.status(500).send({ error: 'Failed to fetch your tour packages' });
      }
    });

    // 3. Get one tour package by ID (public)
    app.get('/tourPackages/:id', async (req, res) => {
      try {
        const id = req.params.id;
        const packageData = await packageCollection.findOne({ _id: new ObjectId(id) });
        packageData
          ? res.json(packageData)
          : res.status(404).send({ error: 'Tour package not found' });
      } catch (error) {
        res.status(500).send({ error: 'Failed to fetch tour package' });
      }
    });

    // 4. Get bookings (protected, only for logged-in user)
    app.get('/bookings', verifyFirebaseToken, async (req, res) => {
      const tokenEmail = req.decoded?.email?.toLowerCase();
      const queryEmail = req.query.email?.toLowerCase();
      if (!tokenEmail || tokenEmail !== queryEmail) {
        return res.status(403).send({ error: 'Forbidden access' });
      }
      let query = { buyerEmail: tokenEmail };
      try {
        const bookings = await bookingCollection.find(query).toArray();
        res.json(bookings);
      } catch (error) {
        res.status(500).send({ error: 'Failed to fetch bookings' });
      }
    });

    // 5. Add new tour package (public, but you may want to protect this)
    app.post('/tourPackages', async (req, res) => {
      try {
        const tourPackage = req.body;
        const result = await packageCollection.insertOne(tourPackage);
        res.send(result);
      } catch (error) {
        res.status(500).send({ error: 'Failed to add tour package' });
      }
    });

    // 6. Add new booking (protected, only logged-in user can book)
    app.post('/bookings', verifyFirebaseToken, async (req, res) => {
      try {
        const booking = req.body;
        const tokenEmail = req.decoded?.email?.toLowerCase();
        if (!tokenEmail || tokenEmail !== booking.buyerEmail?.toLowerCase()) {
          return res.status(403).send({ error: 'Forbidden access' });
        }
        const result = await bookingCollection.insertOne(booking);
        // Increment booking_count for the booked tour package
        if (booking.packageId) {
          await packageCollection.updateOne(
            { _id: new ObjectId(booking.packageId) },
            { $inc: { booking_count: 1 } }
          );
        }
        res.send(result);
      } catch (error) {
        res.status(500).send({ error: 'Failed to add booking' });
      }
    });

    // 7. Update a tour package (protected, only guide can update)
    app.put('/tourPackages/:id', verifyFirebaseToken, async (req, res) => {
      try {
        const { id } = req.params;
        const tokenEmail = req.decoded?.email?.toLowerCase();
        const pkg = await packageCollection.findOne({ _id: new ObjectId(id) });
        if (!pkg) return res.status(404).send({ error: 'Package not found' });
        if (pkg.guideEmail?.toLowerCase() !== tokenEmail) {
          return res.status(403).send({ error: 'Forbidden access' });
        }
        const updateDoc = { $set: req.body };
        await packageCollection.updateOne({ _id: new ObjectId(id) }, updateDoc);
        const updated = await packageCollection.findOne({ _id: new ObjectId(id) });
        res.send(updated);
      } catch (error) {
        res.status(500).send({ error: 'Failed to update package' });
      }
    });

    // 8. Delete a tour package (protected, only guide can delete)
    app.delete('/tourPackages/:id', verifyFirebaseToken, async (req, res) => {
      try {
        const { id } = req.params;
        const tokenEmail = req.decoded?.email?.toLowerCase();
        const pkg = await packageCollection.findOne({ _id: new ObjectId(id) });
        if (!pkg) return res.status(404).send({ error: 'Package not found' });
        if (pkg.guideEmail?.toLowerCase() !== tokenEmail) {
          return res.status(403).send({ error: 'Forbidden access' });
        }
        await packageCollection.deleteOne({ _id: new ObjectId(id) });
        res.send({ success: true });
      } catch (error) {
        res.status(500).send({ error: 'Failed to delete package' });
      }
    });

    // 9. Update booking status (protected)
    app.patch('/bookings/:id', verifyFirebaseToken, async (req, res) => {
      try {
        const { id } = req.params;
        const { status } = req.body;
        await bookingCollection.updateOne(
          { _id: new ObjectId(id) },
          { $set: { status } }
        );
        res.send({ success: true });
      } catch (error) {
        res.status(500).send({ error: 'Failed to update booking status' });
      }
    });

    // Confirm MongoDB connection
    await client.db("admin").command({ ping: 1 });
    console.log("✅ Connected to MongoDB");
  } catch (err) {
    console.error("❌ Error in server startup:", err);
  }
}

run().catch(console.dir);

// Root route
app.get('/', (req, res) => {
  res.send('TourBuzz Server is Live 🚀');
});

app.listen(port, () => {
  console.log(`TourBuzz Server is running on http://localhost:${port}`);
});