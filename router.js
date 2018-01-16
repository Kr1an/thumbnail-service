const {
  JobRequest,
} = require('./models');

const sendTask = require('./task');

module.exports = require('express').Router()
  .get('/:id?', getJobRequestById)
  .post('/', registerServiceWorker)
  .post('/:id?', imageReturningFromWorker)
  .patch('/:id?', updateJobRequest);

async function registerServiceWorker(req, res) {
  const jobRequest = new JobRequest(req.body);
  const doc = await jobRequest.save()
    .catch(err => res.send(err.toString()))

  sendTask(doc._id, doc.url);
  res.send(doc.toJSON());
}

async function imageReturningFromWorker(req, res) {
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
}

async function updateJobRequest(req, res) {
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
}


async function getJobRequestById (req, res) {
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
}
