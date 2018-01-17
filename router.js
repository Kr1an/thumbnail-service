const {
  JobRequest
} = require('./models');

const
  router        = require('express').Router();
  messageWorker = require('./task');

const fileGen = id => `${id}.png`;

router
  .get('/:id?', getJobRequestById)
  .post('/', registerServiceWorker)
  .post('/:id?', imageReturningFromWorker)
  .patch('/:id?', updateJobRequest);

async function registerServiceWorker(req, res) {
  const jobRequest = new JobRequest(req.body);
  const doc = await jobRequest.save()
    .catch(err => res.send(err.toString()));

  messageWorker(doc._id, doc.url);
  res.send(doc.toJSON());
}

async function imageReturningFromWorker(req, res) {
    const {
      files,
      params: {
        id,
      },
    } = req;
    if (!files || !files.file || !id) {
      const jobRequest = await JobRequest.findById(id);
      await jobRequest.update({ status: 'failed' });
      return res.sendStatus(200);
    }
    files.file.mv(`public/${fileGen(id)}`);

    const jobRequest = await JobRequest.findById(id);
    await jobRequest.update({
      status: 'success',
      thumbnailUrl: fileGen(id),
    });

    res.sendStatus(200);
}

async function updateJobRequest(req, res) {
    const {
      body,
      params: {
        id
      },
    } = req;
    if (!id) {
        throw new Error('id is not specified');
    }
    const updatedJobRequest = await JobRequest.update({ _id: id }, body, { upsert: true } );
    res.send(JSON.stringify(updatedJobRequest, null, '\t'));
}


async function getJobRequestById (req, res) {
  const {
    params: {
      id,
    },
  } = req;
  if (id) {
      const jobRequest = await JobRequest.findById(id);
      return res.send(JSON.stringify(jobRequest, null, '\t'));
  }
  const jobRequests = await JobRequest.find();
  res.send(JSON.stringify(jobRequests, null, '\t'));
}

module.exports = router
