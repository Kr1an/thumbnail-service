const amqp = require('amqplib/callback_api');
const request = require('request');
const fs = require('fs');
const sharp = require('sharp');
const INTERVAL_DELAY = 2000;
const startUpInterval = setInterval(startUp, INTERVAL_DELAY);
const resizer = sharp()
    .resize(64, 64)
    .png()

function startUp() {
    amqp.connect('amqp://rabbit', function(err, conn) {
        if (conn) {
            console.log('Rabbit conn setted up.');
            clearInterval(startUpInterval);
        } else {
            console.log(`Rabbit conn failed. Will repeat  in ${INTERVAL_DELAY} ms.`)
            console.log(`Error Desc: ${err}`)
            return
        }
        conn.createChannel(function(err, ch) {
            const ex = 'sw';
            ch.assertExchange(ex, 'direct', { durable: true });
            ch.assertQueue('', { exclusive: true }, function (err, q) {
                ch.bindQueue(q.queue, ex, '');
                ch.consume(q.queue, async function(msg) {
                    const msgObj = JSON.parse(msg.content);
                    console.log(`reqeusting image from ${msgObj.url}`)
                    const image = request(msgObj.url)
                        .pipe(
                            sharp()
                                .resize(64, 64)
                                .png()

                        )
                    let file;
                    try {
                        file = await image.toFile(`${msgObj.id}.png`);
                    } catch (e) {
                        console.log("Error while transforming file: ")
                        console.log(e);
                        request(request.post(`http://api:3000/jobrequests/${msgObj.id}`, (err, res) => {}))
                        return
                    }
                    const req = request.post(`http://api:3000/jobrequests/${msgObj.id}`, (err, res) => {
                        if (!err) {
                            fs.unlinkSync(`${msgObj.id}.png`);
                        }
                    });
                    const form = req.form();
                    form.append('file', fs.createReadStream(`${msgObj.id}.png`));
                }, { noAck: true })
            })
            ch.prefetch(1);
        });
    });
}
