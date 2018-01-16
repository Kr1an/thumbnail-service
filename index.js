const {
  JobRequest,
} = require('./models');
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const fileUpload = require('express-fileupload');
const cors = require('cors');
const path = require('path');
const thumbnailTask = require('./task')
var amqp = require('amqplib/callback_api');

const app = express();

app.use(express.static(path.join(__dirname, 'public')))
app.use(cors());
app.use(fileUpload());
app.use(bodyParser.json());

mongoose.connect(`mongodb://mongodb/jobhub`, { useMongoClient: true });

app.post('/jobrequests', (req, res) => {
  const jr = new JobRequest(req.body);
  jr.save((err, doc) => {
    if (err) {
        return res.send(err.toJSON())
    } else {     
        thumbnailTask.sendTask(JSON.stringify({
            id: doc._id,
            imageUrl: doc.url,
        }));
        return res.send(doc.toJSON());
    }
  })
})

// Route to provide thumbnail read stream
app.post('/jobrequests/:id?', async (req, res) => {
    console.log("Getting formatted thumbnail")
    const files = req.files;
    if (files) {
        files.file.mv(`public/${req.params.id}.png`);
        const jobRequest = await JobRequest.findById(req.params.id);
        await jobRequest.update({ status: 'success', thumbnailUrl: `${req.params.id}.png`});
        console.log(`status for ${req.params.id} was updated`)
        res.sendStatus(200);
    } else {
        res.sendStatus(403);
        const jobRequest = await JobRequest.findById(req.params.id);
        await jobRequest.update({ status: 'failed' });
        console.log(`Failed Job. Status for ${req.params.id} was updated`)
    }
})



app.patch('/jobrequests/:id?', async (req, res) => {
    try {
        console.log("patching job entity by id with:")
        const patchObject = req.body;
        if (!req.params.id) {
            throw new Error('id is not specified');
        }
        return res.send(JSON.stringify(
            await JobRequest.update(
                { _id: req.params.id },
                patchObject,
                { upsert: true },
            ), null, '\t'));
    } catch (e) {
        console.error(e);
        res.sendStatus(403);
    }
})

app.get('/jobrequests/:id?', async (req, res) => {
    try {
        console.log("getting job entity by id")
        if (!req.params.id) {
            const jobRequests = await JobRequest.find();
            return res.send(JSON.stringify(jobRequests, null, '\t'));
        }
        return res.send(JSON.stringify(await JobRequest.findById(req.params.id), null, '\t'));
    } catch (e) {
        console.error(e);
        res.sendStatus(403);
    }
})

app.listen(
  3000,
  err => console.log(err || 'running on port 3000')
);