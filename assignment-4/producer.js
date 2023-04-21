// const amqp = require('amqplib')

// const rabbitmqHost = process.env.RABBITMQ_HOST || 'localhost'
// const rabbitmqUrl = `amqp://${rabbitmqHost}`

// async function main() {
//     console.log("URL: ", rabbitmqUrl)
//     const connection = await amqp.connect(rabbitmqUrl)
//     console.log("CONNECTED")
//     const channel = await connection.createChannel()
//     await channel.assertQueue('echo')

//     const sentence = "The obese brown seal jumped over the lazy meow meow"
//     sentence.split(' ').forEach(function(word){
//         channel.sendToQueue('echo', Buffer.from(word))
//     })

//     setTimeout(function(){
//         connection.close()
//     }, 500)
// }

// main()