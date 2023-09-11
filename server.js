const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { google } = require('googleapis');
const privatekey = require('./auth.json');
const nodemailer = require('nodemailer');

const app = express();
app.use(express.json());
app.use(cors());

const port = 3001;
const password = encodeURIComponent('Manal@2023');
// const uri = `mongodb+srv://manallifecoach2023:${password}@cluster0.yggsvdd.mongodb.net/Bookings`;
const uri = "mongodb://127.0.0.1:27017/Bookings"

// Connect to MongoDB Atlas and set the connection variable
mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
    .then((() => console.log("connected to mongodb")))
    .catch(error => console.error("failed to connect to mongo db", error));

//schema creation to send the date to mongo
const UserSchema = new mongoose.Schema({
    username: { type: String, required: true },
    useremail: { type: String, required: true, lowercase: true },
    userPhone: { type: String, required: true },
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

const User = mongoose.model('Users', UserSchema);

// Create events in My Google Calendar
const createEvent = async (userData) => {
    try {
        const jwtClient = new google.auth.JWT(
            privatekey.client_email,
            null,
            privatekey.private_key,
            ['https://www.googleapis.com/auth/calendar']
        );

        await jwtClient.authorize();

        const calendar = google.calendar({ version: 'v3', auth: jwtClient });

        for (const bookingData of userData.reservationDate) {
            console.log('bookingData.date:', bookingData.date);
            console.log('bookingData.time:', bookingData.time);

            const [hours, minutes, period] = bookingData.time.split(/:| /);
            let hour = parseInt(hours, 10);

            if (period.toLowerCase() === 'pm' && hour < 12) {
                hour += 12;
            } else if (period.toLowerCase() === 'am' && hour === 12) {
                hour = 0;
            }

            const startDate = new Date(`${bookingData.date}T${hour.toString().padStart(2, '0')}:${minutes}:00`);
            const endDate = new Date(startDate.getTime() + 1 * 60 * 60 * 1000); // Set end time 1 hour after start time

            const event = {
                summary: userData.username,
                description: `${userData.packageType}\nEmail: ${userData.useremail}\nPhone Number: ${userData.userPhone}`,
                start: {
                    dateTime: startDate.toISOString(),
                    timeZone: 'Europe/Brussels',
                },
                end: {
                    dateTime: endDate.toISOString(),
                    timeZone: 'Europe/Brussels',
                },
            };

            await calendar.events.insert({
                calendarId: privatekey.calendar_ID,
                resource: event,
            });
        }

        console.log('Events created');
    } catch (error) {
        console.error('Error creating events:', error);
    }
};

// Nodemailer transporter configuration
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'manallifecoach2023@gmail.com',
        pass: 'uypkrbiiofqybwtq',
    }
});

// Send Data Im retreaving from the Frontend and send to My MongoDb
app.post('/api/bookings', (req, res) => {
    const { username, useremail, userPhone, price, packageType, reservationDate } = req.body;

    const newUser = new User({
        username,
        useremail,
        userPhone,
        packageType,
        price,
        reservationDate,
    });

    newUser
        .save()
        .then(() => {
            // Create calendar events
            createEvent(newUser);

            // Construct the email content with dates and times
            const reservationDetails = reservationDate.map((bookingData, index) => {
                const [date, time] = [bookingData.date, bookingData.time];
                return `${date} at ${time}${index === reservationDate.length - 1 ? '\n' : ','}`;
            }).join(',\n');

            const mailOptions = {
                from: 'manallifecoach2023@gmail.com',
                to: useremail,
                subject: 'Reservation Confirmation',
                text: `Your reservation for:\n${reservationDetails}\nhas been successful. Thank you!`, // Include reservation details here
                headers: {
                    'Importance': 'high',
                },
            };


            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    console.error('Error sending email:', error);
                } else {
                    console.log('Email sent:', info.response);
                }
            });

            res.json({ message: 'Booking created successfully' });
        })
        .catch((error) => {
            console.error('Error saving booking:', error);
            res.status(500).json({ message: 'Failed to create booking' });
        });
});

// Fetch tn dates and times in My MongoDb
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