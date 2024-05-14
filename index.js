const express = require('express');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cors = require('cors');
require('dotenv').config()
const app = express();
const port = process.env.PORT || 5000;



// middleware
app.use(express());
app.use(cors({
    origin: [
        "http://localhost:5173",
        "https://cardoctor-bd.web.app",
        "https://cardoctor-bd.firebaseapp.com",
    ],
    credentials: true,
}));


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

        const dreamyDestinyRoomsCollection = client.db('dreamyDestinyDB').collection('Rooms')
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

        app.get('/rooms', async(req,res) => {
            const cursor = dreamyDestinyRoomsCollection.find();
            const result = await cursor.toArray();
            res.send(result)
            
        });
        app.get('/room-details/:id', async(req,res)=> {
            const id = req.params.id;
            const query = {_id : new ObjectId(id)}
            const result = await dreamyDestinyRoomsCollection.findOne(query);
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

