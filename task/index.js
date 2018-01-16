const amqp = require('amqplib');

async function messageWorker(id, url) {
  const conn = await amqp.connect('amqp://rabbit');
  const ch = await conn.createChannel();
  ch.assertExchange('sw', 'direct', { durable: true })
  ch.publish('sw', '', new Buffer(JSON.stringify({ id, url })));
}

module.exports = messageWorker;
