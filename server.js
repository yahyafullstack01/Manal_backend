const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

app.use(express.json());
app.use(cors());
const port = 3001;
// Connect to MongoDB Atlas and set the connection variable
mongoose.connect("mongodb+srv://yahyafullstack01:Yahya1998@yahya.nmc63m5.mongodb.net/", { 
        useNewUrlParser: true, useUnifiedTopology: true 
})
.then((()=> console.log("connected to mongodb")))
.catch(error=>console.error("failed to connect to mongo db",error));





app.listen(port, ()=>{
    console.log(`listening on ${port}`);
})