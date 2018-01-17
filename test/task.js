const sinon = require('sinon');
const {
  expect,
} = require('chai');

const task = require('../task');
const amqp = require('amqplib');


describe('test task service unites', function() {
  it('should provice args in correct form to queue', function(done) {
    const
      ch = {
        assertExchange: sinon.spy(),
        publish: sinon.spy(doneFn),
      },
      conn = {
        createChannel: () => Promise.resolve(ch),
      },
      connectPromise = Promise.resolve(conn),
      amqpM = sinon.stub(amqp, 'connect').resolves(connectPromise)

    function doneFn() {
      done();
      sinon.assert.calledOnce(ch.publish);
      sinon.assert.calledOnce(amqpM);
      const bufferArgs = ch.publish.lastCall.args.slice(-1);
      expect(bufferArgs).to.be.an('array');
      expect(bufferArgs.length).to.be.equal(1);
      const buffer = JSON.parse(Array.from(bufferArgs)[0]);
      expect(buffer).to.have.property('id', 123);
      expect(buffer).to.have.property('url', 'qwe');
    }

    task.messageWorker(123, 'qwe');

    amqpM.restore()
  })
})
