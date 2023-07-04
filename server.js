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

const UserSchema = new mongoose.Schema({
    username: {type: String, required: true},
    useremail:{ type :String,required:true },
    package: {type:String},
    userphone:{type:String, required:true},
    sessionsnumber:{type:String},
    reservationDate:[{
        date:{type:String, required:true},
        time:{type:String, required:true},
    }]
});

UserSchema.pre('save', function(next){
    this.reservationDate= this.reservationDate.map((item)=>({
        date : new Date(item.date).toISOString().split('T')[0],
        time : item.time,

    })
    )
    next();
})

const Users=new mongoose.model('Users',UserSchema);

const test = new Users({
    username: 'Harry',
    useremail: 'Harry@gmail.com',
    userphone: '1231232',
    package:'',
    sessionsnumber:'12',
    
    reservationDate: [
        { date: new Date('2023-07-12'), time: '09:00 AM' },
        { date: new Date('2023-07-12'), time: '10:00 AM' },
        { date: new Date('2023-07-12'), time: '11:00 AM' },
    ]
});

test.save()
    .then(() => {
        console.log('User saved successfully');
    })
    .catch((error) => {
        console.error('Error saving user:', error);
    });





app.listen(port, ()=>{
    console.log(`listening on ${port}`);
})