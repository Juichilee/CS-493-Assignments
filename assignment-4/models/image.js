const fs = require('fs')
const { ObjectId, GridFSBucket } = require('mongodb');

const { getDbReference } = require('../lib/mongo');
const { getChannel } = require('../lib/rabbitmq')

const queue = 'photos'

exports.saveImageFile = function (image) {
  return new Promise(function (resolve, reject) {
    const db = getDbReference()
    const bucket = new GridFSBucket(db, { bucketName: 'photos' })
    
    const metadata = {
      userId: image.userId,
      businessId: image.businessId,
      caption: image.caption,
      path: image.path,
      filename: image.filename,
      mimetype: image.mimetype
    }

    const uploadStream = bucket.openUploadStream(image.filename, {
      metadata: metadata
    })

    fs.createReadStream(image.path).pipe(uploadStream)
      .on('error', function (err) {
        reject(err)
      })
      .on('finish', function (result) {
        //channel = getChannel()
        //channel.sendToQueue(queue, Buffer.from(result._id.toString()))
        resolve(result._id)
      })
  })
}

// exports.saveImageInfo = async function (image) {
//   const db = getDbReference();
//   const collection = db.collection('photos');
//   const result = await collection.insertOne(image);
//   return result.insertedId;
// };

exports.getImageInfoById = async function (id) {
  const db = getDbReference();
  // const collection = db.collection('images');
  const bucket = new GridFSBucket(db, { bucketName: 'photos' })

  if (!ObjectId.isValid(id)) {
    return null;
  } else {
    const results = await bucket.find({ _id: new ObjectId(id) })
      .toArray();
    return results[0];
  }
};

exports.getImageInfoByBusinessId = async function (id) {
  const db = getDbReference();
  // const collection = db.collection('images');
  const bucket = new GridFSBucket(db, { bucketName: 'photos' })

  if (!ObjectId.isValid(id)) {
    return null;
  } else {
    console.log("BusinessID: ", id)
    const projection = { "_id": 1, "uploadDate": 1, "filename": 1, "metadata.userId": 1, "metadata.businessId": 1, "caption": 1, "mimetype": 1, "thumbId": 1 }
    const results = await bucket.find({ "metadata.businessId": id }).project(projection)
      .toArray();
    console.log("Image Results: ", results)
    return results;
  }
};

exports.getDownloadStreamByFilename = function(filename, bucketName) {
  const db = getDbReference()
  const bucket = new GridFSBucket(db, { bucketName: bucketName })
  return bucket.openDownloadStreamByName(filename)
}

exports.getDownloadStreamById = function (id) {
    const db = getDbReference()
    const bucket = new GridFSBucket(db, { bucketName: 'photos' })
    if (!ObjectId.isValid(id)) {
      return null
    } else {
      return bucket.openDownloadStream(new ObjectId(id))
    }
  }
  
  exports.updateImageTagsById = async function (id, tags) {
    const db = getDbReference()
    const collection = db.collection('photos.files')
    if (!ObjectId.isValid(id)) {
      return null
    } else {
      const result = await collection.updateOne(
        { _id: new ObjectId(id) },
        { $set: { "metadata.tags": tags }}
      )
      return result.matchedCount > 0
    }
  }