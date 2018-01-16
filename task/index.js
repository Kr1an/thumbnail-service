var amqp = require('amqplib/callback_api');

const sendTask = (id, url) => {
    const message = {
      id,
      url,
    };
    amqp.connect('amqp://rabbit', function(err, conn) {
    console.log(err);
    conn.createChannel(function(err, ch) {
        var ex = 'sw';
        var msg = JSON.stringify(message);
        ch.assertExchange(ex, 'direct', { durable: true });
        ch.publish(ex, '', new Buffer(msg));
        console.log(" [x] Sent '%s'", msg);
    });
    setTimeout(function() { conn.close() }, 500);
    });
}

module.exports = sendTask
