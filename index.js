const express = require('express');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
require('dotenv').config()
const app = express();
const port = process.env.PORT || 5000;



// middleware

app.use(cors({
    origin: [
        "http://localhost:5173",
        "https://dreamydestiny-hotel.web.app",
        "https://dreamydestiny-hotel.firebaseapp.com/",
    ],
    credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

// custom middleware

const verifyToken = async (req, res, next) => {
    const token = req.cookies?.token;
    console.log('value of the  middleware :', token);
    if (!token) {
        return res.status(401).send({ message: "not authorized" })
    }
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).send({ message: "not authorized" })
        }
        console.log('value in the  token', decoded);
        req.user = decoded
        next()
    })

}

// cookie option
const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
};




const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.taokb31.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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
        // await client.connect();

        const roomsCollection = client.db('dreamyDestinyDB').collection('Rooms');
        const bookingCollection = client.db('dreamyDestinyDB').collection('bookings');
        const reviewCollection = client.db('dreamyDestinyDB').collection('reviews');


        //creating Token
        app.post("/jwt", async (req, res) => {
            const user = req.body;
            console.log("user for token", user);
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET);

            res.cookie("token", token, cookieOptions).send({ success: true });
        });

        //clearing Token
        app.post("/logout", async (req, res) => {
            const user = req.body;
            console.log("logging out", user);
            res
                .clearCookie("token", { ...cookieOptions, maxAge: 0 })
                .send({ success: true });
        });


        // // rooms collection API
        app.get('/featured-rooms', async (req, res) => {


            const cursor = roomsCollection.find();
            const result = await cursor.toArray();
            res.send(result)

        });

        app.get('/rooms', async (req, res) => {
            const { minPrice, maxPrice } = req.query;
            console.log(req.query);
            const cursor = roomsCollection.find({
                price_per_night: {
                    $gte: parseInt(minPrice),
                    $lte: parseInt(maxPrice)
                }
            });
            const result = await cursor.toArray();
            console.log(result);
            res.json(result);
        });



        app.get('/room-details/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await roomsCollection.findOne(query);
            res.send(result)
        });


        // booking Collection API
        app.get('/bookings', async (req, res) => {
            const cursor = bookingCollection.find();
            const result = await cursor.toArray();
            res.send(result)

        });

        app.post('/bookings', async (req, res) => {
            const booking = req.body;
            console.log(booking);
            const result = await bookingCollection.insertOne(booking);
            res.send(result)
        })
        // get my booking data by email
        app.get("/my-bookings/:email", async (req, res) => {
            const email = req.params.email
            const query = { email: email }
            const result = await bookingCollection.find(query).toArray();
            res.send(result)
        });
        // update date
        app.patch('/bookings/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const updateDoc = {
                $set: {
                    checkInDate: req.body.checkInDate,
                    checkOutDate: req.body.checkOutDate
                }
            };
            const result = await bookingCollection.updateOne(query, updateDoc);
            res.send(result)

        });
        // cancel booking
        app.delete('/bookings/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await bookingCollection.deleteOne(query);
            res.send(result)
        });

        app.post('/reviews', async(req,res)=> {
            const review = req.body;
            console.log(review);
            const result = await reviewCollection.insertOne(review);
            res.send(result)
        })












        // Send a ping to confirm a successful connection
        // await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);



app.get('/', (req, res) => {
    res.send('dreamydestiny hotel are running');
});

app.listen(port, (req, res) => {
    console.log(`dreamydestiny running on port : ${port}`);
})

