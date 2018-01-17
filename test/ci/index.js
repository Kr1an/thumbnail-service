const request = require('request-promise');
const { JobRequest } = require('../../models')
const mongoose = require('mongoose');
const chai = require('chai');
const amqp = require('amqplib');

const expect = chai.expect;
const RABBIT_URL = 'amqp://rabbit'
const BASE_URL = 'http://api:3000/';
const validImgUrl = 'http://static.guim.co.uk/sys-images/Guardian/Pix/pictures/2014/4/11/1397210130748/Spring-Lamb.-Image-shot-2-011.jpg';
const invalidImgUrl = validImgUrl.slice(0, -10);

mongoose.connect('mongodb://mongodb/jobhub');

function delay(t, v) {
   return new Promise(function(resolve) {
       setTimeout(resolve.bind(null, v), t)
   });
}

describe('job request root test', () => {
  describe('testing get requests', () => {
    before(async function() {
      this.tmpJobRequest = await new JobRequest({ url: 'test-url' }).save();
      this.tmpId = this.tmpJobRequest._id;
    })
    after(async function() {
      const res = await JobRequest.remove({ _id: this.tmpJobRequest._id });
    })
    it('/jobrequests should return list of job requests', async () => {
      const res = await request(BASE_URL + 'jobrequests')
      const resObj = JSON.parse(res);
      expect(resObj).to.be.an('array');
    })
    it('/jobreqeusts/<id> should return specific item', async function() {
      const res = await request(BASE_URL + `jobrequests/${this.tmpJobRequest._id}`);
      const obj =JSON.parse(JSON.stringify(this.tmpJobRequest));
      expect(obj).to.deep.equal(JSON.parse(res));
    })
  })
  describe('test main flow', function () {
    it('should be successful', async () => {
      options = {
          method: 'POST',
          uri: BASE_URL + 'jobrequests',
          body: {
              url: validImgUrl,
          },
          json: true,
      };
      const res = await request(options);
      const creatingObjectId = res._id;
      async function imageExist() {
        let overoll = 0;
        while(true) {
          try {
            let res = await request(BASE_URL + creatingObjectId + '.png');
            return res;
          } catch (e) {
            await delay(100, () => null)
            overoll += 100;
            if (overoll > 2000) {
              throw e;
            }
          }
        }
      }
      const imageRes = await imageExist();
      const updatedObject = await JobRequest.findById(creatingObjectId);
      expect(updatedObject.status).to.be.equal('success');
      expect(updatedObject.thumbnailUrl).to.be.equal(creatingObjectId + '.png');
      JobRequest.remove({ _id: creatingObjectId });
    })
  })
  describe('test main flow', function () {
    it('should be failed', async () => {
      const invalidUrl =
      options = {
          method: 'POST',
          uri: BASE_URL + 'jobrequests',
          body: {
              url: invalidImgUrl,
          },
          json: true,
      };
      const res = await request(options);
      const creatingObjectId = res._id;
      async function imageExist() {
        let overoll = 0;
        while(true) {
          try {
            let res = await request(BASE_URL + creatingObjectId + '.png');
            return res;
          } catch (e) {
            await delay(100, () => null)
            overoll += 100;
            if (overoll > 2000) {
              expect(!!e).to.be.ok;
              return null;
            }
          }
        }
      }
      const imageRes = await imageExist();
      if (imageRes) {
        throw new Error('should be undefined' + imageRes)
      }

      const updatedObject = await JobRequest.findById(creatingObjectId);
      expect(updatedObject.status).to.be.equal('failed');
      expect(!updatedObject.thumbnailUrl).to.be.ok;
    })
  })
  describe('several requests at a time', function() {
    it('should handle several requests in one moment', async () => {
      const numOfSessions = 2;
      const sessions = new Array(numOfSessions).fill({});
      options = {
          method: 'POST',
          uri: BASE_URL + 'jobrequests',
          body: {
              url: validImgUrl,
          },
          json: true,
      };
      const res = Array.from(await Promise.all(sessions.map(x => request(options))));
      let overoll = 0;
      while(true) {
        const createdObjects = await Promise.all(res.map(x => request(BASE_URL + 'jobrequests/' + x._id)));
        const allCreated = Array.from(createdObjects).map(x => JSON.parse(x).status).map(x => x==='success').every(x => x)
        if(!allCreated) {
          overoll += 200;
          await delay(200, () => null);
          if (overoll > 2000) {
            throw new Error('too late');
          }
        } else {
          break;
        }
      }

      const savedObjects = (await Promise.all(res.map(x => request(BASE_URL + 'jobrequests/' + x._id)))).map(x => JSON.parse(x));

      await Promise.all(savedObjects.map(x => request(BASE_URL + x.thumbnailUrl)))
    })
  })
  describe("test rabbit connation", function() {
    it('should connect to rabbit', async function() {
      const conn = await amqp.connect(RABBIT_URL);
      expect(conn).to.be.ok;
    })
  })
  describe('test mongo connation', function() {
    it('get some info from already connected mongodb', async function() {
      const res = await JobRequest.find();
      expect(res).to.be.ok;
    })
  })
})
