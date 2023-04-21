const amqp = require('amqplib')

// const rabbitmqHost = process.env.RABBITMQ_HOST || 'localhost'
// const rabbitmqUrl = `amqp://${rabbitmqHost}:8080`
const rabbitmqUrl = 'amqp://rabbitmq'

let connection = null
let channel = null
const queue = 'photos'

exports.connectToRabbitMQ = async function (queue) {

    console.log("URL: ", rabbitmqUrl)

    connection = await amqp.connect(rabbitmqUrl)
    console.log("CONNECTED")
    channel = await connection.createChannel()
    await channel.assertQueue('photos')
}

exports.getChannel = function () {
    return channel
}