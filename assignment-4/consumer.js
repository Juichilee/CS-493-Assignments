const amqp = require('amqplib')
const jimp = require('jimp')
const fs = require('fs')
const path = require('path')

const { ObjectId, GridFSBucket } = require('mongodb');

const queue = 'photos'

const rabbitmqHost = process.env.RABBITMQ_HOST || 'rabbitmq'
const rabbitmqUrl = `amqp://${rabbitmqHost}`

const { connectToDb, getDbReference } = require('./lib/mongo')
const { getChannel } = require('./lib/rabbitmq')
const { getDownloadStreamByFilename } = require('./models/image')

async function main() {
    // channel = getChannel()
    console.log("URL: ", rabbitmqUrl)

    connection = await amqp.connect(rabbitmqUrl)
    console.log("CONNECTED")
    channel = await connection.createChannel()
    await channel.assertQueue('photos')

    channel.consume('photos', function(msg){
        if(msg){
            fileName = msg.content.toString()
            console.log(fileName)

            // photo = fs.readFile(`./uploads/${fileName}`)
            // var myFile = fs.createWriteStream("./uploads/temp.jpg")

            // getDownloadStreamByFilename(fileName)
            // .pipe(myFile)

            // myFile.end()

            console.log("Completed Download")

            jimp.read(`${__dirname}/uploads/${fileName}`)
            .then(lenna => {
                return lenna
                .resize(100, 100) // resize
                .write(`${__dirname}/uploads/modifiedtemp.jpg`, () => {
                    return new Promise(function (resolve, reject) {
                        const db = getDbReference()
                        const thumbsbucket = new GridFSBucket(db, { bucketName: 'thumbs' })

                        const metadata = {
                          filename: fileName
                        }
                    
                        const uploadStream = thumbsbucket.openUploadStream(fileName, {
                          metadata: metadata
                        })
                    
                        fs.createReadStream(`${__dirname}/uploads/modifiedtemp.jpg`).pipe(uploadStream)
                        .on('error', function (err) {
                            reject(err)
                        })
                        .on('finish', async function (result) {
                            //channel = getChannel()
                            //channel.sendToQueue(queue, Buffer.from(result._id.toString()))
                            const collection = db.collection('photos.files')
                            await collection.updateOne(
                                { filename: fileName },
                                { $set: { "metadata.thumbId": result._id }}
                            )

                            resolve(result._id)
                        })
                    })
                }); // save
            })
            .catch(err => {
                console.error(err);
            });

            console.log("COMPLETED RESIZE")

            // return new Promise(function (resolve, reject) {
            //     const db = getDbReference()
            //     const bucket = new GridFSBucket(db, { bucketName: 'thumbs' })
                
            //     const metadata = {
            //       filename: fileName,
            //     }
            
            //     const uploadStream = bucket.openUploadStream(fileName, {
            //       metadata: metadata
            //     })
            
            //     fs.createReadStream(`${__dirname}/uploads/modifiedtemp.jpg`).pipe(uploadStream)
            //     .on('error', function (err) {
            //         reject(err)
            //     })
            //     .on('finish', function (result) {
            //         //channel = getChannel()
            //         //channel.sendToQueue(queue, Buffer.from(result._id.toString()))
            //         resolve(result._id)
            //     })
            // })

        }
        channel.ack(msg)
    })
}

connectToDb(async () => {
    await main()    
})

// function (photoId) {
//     return new Promise(function (resolve, reject) {
//         const db = getDbReference()
//         const bucket = new GridFSBucket(db, { bucketName: 'thumbs' })
        
//         const metadata = {
//         photoId: photoId
//         }

//         const uploadStream = bucket.openUploadStream(image.filename, {
//         metadata: metadata
//         })

//         fs.createReadStream(image.path).pipe(uploadStream)
//         .on('error', function (err) {
//             reject(err)
//         })
//         .on('finish', function (result) {
//             resolve(result._id)
//         })
//     })
// }

