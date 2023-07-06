const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

app.use(express.json());
app.use(cors());
const port = 3001;
const password = encodeURIComponent('Manal@2023'); // URL-encode the password
const uri = `mongodb+srv://manallifecoach2023:${password}@cluster0.yggsvdd.mongodb.net/Bookings`;
// Connect to MongoDB Atlas and set the connection variable
mongoose.connect(uri, { 
        useNewUrlParser: true, useUnifiedTopology: true 
})
.then((()=> console.log("connected to mongodb")))
.catch(error=>console.error("failed to connect to mongo db",error));


//create schema for sending the date to mongo
const UserSchema = new mongoose.Schema({
    username: {type: String, required: true},
    useremail:{ type :String,required:true },
    package: {type:String},
    userphone:{type:String, required:true},
    sessionsnumber:{type:String},
    reservationDate:[{
        _id: false,
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

//get the data form mongo 
app.get('/api/users', async (req, res) => {
    try {
        const data = await Users.find({});
        const dateTimeArr = data.map((item) => item.reservationDate).flat();
        const FilteredDateTime = dateTimeArr.map((obj) => {
            const newObj = { ...obj._doc };
            return newObj;
        });
        res.json(FilteredDateTime);
    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).json({ message: 'Failed to fetch data' });
    }
});

//for sending the data to mongodb
const test = new Users({
    username: 'Sss',
    useremail: 'Samer@gmail.com',
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