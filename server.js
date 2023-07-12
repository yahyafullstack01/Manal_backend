const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const app = express();

app.use(express.json());
app.use(cors());

const port = 3001;
const password = encodeURIComponent('Manal@2023');
const uri = `mongodb+srv://manallifecoach2023:${password}@cluster0.yggsvdd.mongodb.net/Bookings`;

// Connect to MongoDB Atlas and set the connection variable
mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
    .then((() => console.log("connected to mongodb")))
    .catch(error => console.error("failed to connect to mongo db", error));

//schema creation to send the date to mongo
const UserSchema = new mongoose.Schema({
    username: { type: String, required: true },
    useremail: { type: String, required: true, lowercase: true },
    userPhone: { type: String, required: true },
    user_session_number: { type: String },
    packageType: { type: String },
    price: { type: String },
    reservationDate: [
        {
            _id: false,
            date: { type: String, required: true },
            time: { type: String, required: true },
        },
    ],
});

UserSchema.pre('save', function (next) {
    this.reservationDate = this.reservationDate.map((item) => ({
        date: new Date(item.date).toISOString().split('T')[0],
        time: item.time,
    }));
    next();
});

// Create a Mongoose model based on the user schema
const User = mongoose.model('Users', UserSchema);

app.post('/api/bookings', (req, res) => {
    const { username, useremail, user_session_number, userPhone, price, packageType, reservationDate } = req.body;


    const newUser = new User({
        username,
        useremail,
        userPhone,
        user_session_number,
        price,
        packageType,
        reservationDate,
    });

    newUser
        .save()
        .then(() => {
            res.json({ message: 'Booking created successfully' });
        })
        .catch((error) => {
            console.error('Error saving booking:', error);
            res.status(500).json({ message: 'Failed to create booking' });
        });
});


app.get('/api/users', async (req, res) => {
    try {
        const data = await User.find({});
        const dateTimeArr = data.map((item) => item.reservationDate).flat();
        const filteredDateTime = dateTimeArr.map((obj) => {
            const newObj = { ...obj._doc };
            return newObj;
        });
        res.json(filteredDateTime);
    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).json({ message: 'Failed to fetch data' });
    }
});


app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});