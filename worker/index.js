const
  amqp    = require('amqplib'),
  request = require('request-promise'),
  fs      = require('fs'),
  sharp   = require('sharp'),
  logger  = require('logops');

const
  INTERVAL_DELAY      = 2000,
  JOBS_CNT_PER_WORKER = 1,
  EXCHANGER_NAME      = 'sw';

const
  startUpInterval = setInterval(startUp, INTERVAL_DELAY),
  fileGen         = id => `${id}.png`,
  tmpFileGen      = id => `${id}.tmp`,
  makePostWithId  = id => (options = {}) => request.post({
    uri: `http://api:3000/jobrequests/${id}`,
    ...options,
  });

async function messageHandler(msg) {
  const {
    id,
    url,
  } = JSON.parse(msg.content);
  try {
    const res = await request.get({ url, encoding: null });

    fs.writeFileSync(tmpFileGen(id), res);

    await sharp(tmpFileGen(id))
      .resize(64, 64)
      .png()
      .toFile(fileGen(id));
    await makePostWithId(id)({
      formData: {
        file: fs.createReadStream(fileGen(id)),
      },
    });
  } catch (e) {
    logger.error(e.toString());
    await makePostWithId(id)();
  }
  fs.unlinkSync(fileGen(id));
  fs.unlinkSync(tmpFileGen(id));
}

async function startUp() {
  const conn = await amqp.connect('amqp://rabbit');
  if (conn) {
    clearInterval(startUpInterval);
  }

  const ch = await conn.createChannel();
  const q = await ch.assertQueue('', { exclusive: true });

  ch.assertExchange(EXCHANGER_NAME, 'direct', { durable: true });
  ch.bindQueue(q.queue, EXCHANGER_NAME, '');
  ch.prefetch(JOBS_CNT_PER_WORKER);
  ch.consume(q.queue, messageHandler, { noAck: true });
}

module.exports = {
  startUp,
  messageHandler,
  makePostWithId,
  startUpInterval,
};
