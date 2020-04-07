const cors = require('cors')
const bodyParser = require('body-parser')
const express = require('express')
const app = express()
const port = 5000
const mongoose = require('mongoose');
const mongooseIncrement = require('mongoose-increment');
const increment = mongooseIncrement(mongoose);

app.use(cors())
app.use(bodyParser.json())

require('dotenv').config()

mongoose.connect(`mongodb://${process.env.MONGO_URI}`, {useNewUrlParser: true, useFindAndModify: true});
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function () {
    console.log('connected')
});

const signUpSchema = new mongoose.Schema({
    name: {type: String, index: true, unique: true, required: true},
    submittedTime: {type: Object},
    ageCategory: {type: Number, required: true},
    gender: {type: String, required: true},
    raceNumber: {type: Number, required: true}
});
const slotSchema = new mongoose.Schema({
    slot: {type: String, required: true},
    date: {type: String, required: true},
    raceNumber: {type: Number, required: true}
});
slotSchema.index({slot: 1, date: 1}, {unique: true})

signUpSchema.plugin(increment, {
    modelName: 'SignUp',
    fieldName: 'raceNumber',
});
const SignUp = mongoose.model('SignUp', signUpSchema);
const Slot = mongoose.model('Slot', slotSchema);


app.post('/', (req, res) => {
    const data = req.body
    const signUpData = {
        name: data.name,
        ageCategory: data.ageCategory,
        gender: data.gender,
    }

    SignUp.create(signUpData)
        .then((result) => {
            const slotData = {
                slot: data.slot,
                date: data.date,
                raceNumber: result.raceNumber
            }
            Slot.create(slotData)
                .then((result) => res.status(201).send({raceNumber: result.raceNumber}))
                .catch((error) => res.status(400).send({error}))
        })
        .catch((error) => res.status(500).send({error}))

})

app.post("/submit", (req, res) => {
    const data = req.body
    const {hours, minutes, seconds} = data.submittedTime
    const timeInSeconds = (hours * 3600 + minutes * 60 + seconds)
    SignUp.findOneAndUpdate({raceNumber: data.raceNumber}, {
        submittedTime: {
            ...data.submittedTime,
            timeInSeconds
        },
    }).then((result) => {
        if (result === null) {
            console.log('hel')
            res.status(400).send({message: "fail"})
            return
        }
        res.status(200).send({message: "success"})
    }).catch((error) => {
        console.log(error)
        res.status(500).send({error})
    })
})

app.post("/slot", (req, res) => {
    const data = req.body
    Slot.findOne(data)
        .then((result) => result === null ? res.status(200).send({result}) : res.status(400).send({result}))
        .catch(error => res.status(500).send({error}))
})

app.listen(port, () => console.log(`Example app listening at http://localhost:${port}`))
