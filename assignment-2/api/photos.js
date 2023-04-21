const router = require('express').Router();
const { validateAgainstSchema, extractValidFields } = require('../lib/validation');

const { getDbInstance } = require('../lib/mongo')
const { ObjectId } = require('mongodb')
const photos = require('../data/photos');

const { requireAuthentication } = require('../lib/auth')

exports.router = router;
exports.photos = photos;

/*
 * Schema describing required/optional fields of a photo object.
 */
const photoSchema = {
  userid: { required: true },
  businessid: { required: true },
  caption: { required: false }
};


/*
 * Route to create a new photo.
 */
router.post('/', requireAuthentication, async function (req, res, next) {
  if (req.admin == false && req.user !== req.body.userid) {
    res.status(403).send({
        err: "Unauthorized to access the specified resource"
    })
    next()
  } else {
    if (validateAgainstSchema(req.body, photoSchema)) {
      try{
        const photo = extractValidFields(req.body, photoSchema);
        photo.businessid = new ObjectId(photo.businessid)
        const photoID = await insertNewPhoto(photo)
        res.status(201).json({
          id: photoID,
          links: {
            photo: `/photos/${photoID}`,
            business: `/businesses/${photo.businessid}`
          }
        });
      }catch(err){
        next()
      }
    } else {
      res.status(400).json({
        error: "Request body is not a valid photo object"
      });
    }
  }
});

/*
 * Route to fetch info about a specific photo.
 */
router.get('/:photoID', async function (req, res, next) {
  const photoID = req.params.photoID
  try{
    const photos = await getPhotoById(photoID)
    res.status(200).json(photos)
  }catch(err){
    next()
  }
});

/*
 * Route to update a photo.
 */
router.put('/', requireAuthentication, async function (req, res, next) {
  const photoID = req.body.photoid;
  if (req.admin == false && req.user !== req.body.userid) {
    res.status(403).send({
        err: "Unauthorized to access the specified resource"
    })
    next()
  } else {
    if (validateAgainstSchema(req.body, photoSchema)) {
      /*
      * Make sure the updated photo has the same businessid and userid as
      * the existing photo.
      */
      try{
        const updatedPhoto = extractValidFields(req.body, photoSchema);
        const existingPhoto = await getPhotoById(photoID)

        if (existingPhoto && updatedPhoto.businessid === existingPhoto.businessid.toString() && updatedPhoto.userid === existingPhoto.userid) {
          await modifyPhotoById(photoID, updatedPhoto)
          
          res.status(200).json({
            links: {
              photo: `/photos/${photoID}`,
              business: `/businesses/${updatedPhoto.businessid}`
            }
          });
        } else {
          res.status(403).json({
            error: "Updated photo cannot modify businessid or userid"
          });
        }
      }catch(err){
        next()
      }
    } else {
      res.status(400).json({
        error: "Request body is not a valid photo object"
      });
    }
  }
});

/*
 * Route to delete a photo.
 */
router.delete('/', requireAuthentication, async function (req, res, next) {
  const photoID = req.body.photoid;
  if (req.admin == false && req.user !== req.body.userid) {
    res.status(403).send({
        err: "Unauthorized to access the specified resource"
    })
    next()
  } else {
    try{
      await deletePhoto(photoID)
      res.status(204).end();
    }catch(err){
      next()
    }
  }
});

// MongoDB Functions
async function insertNewPhoto(photo){
  const db = getDbInstance()
  const collection = db.collection('photos')
  photo = extractValidFields(photo, photoSchema)
  const result = await collection.insertOne(photo)
  return result.insertedId
}

async function getPhotoById(id){
  const db = getDbInstance()
  const collection = db.collection('photos')
  const photos = await collection.aggregate([
    { $match: {_id: new ObjectId(id)}}
  ]).toArray()
  return photos[0]
}

async function modifyPhotoById(id, newPhoto){
  const db = getDbInstance()
  const collection = db.collection('photos')
  collection.updateOne({_id: new ObjectId(id)}, { $set: newPhoto}, function(err, res){
    if(err){
      throw err
    }
  })
}

async function deletePhoto(id){
  const db = getDbInstance()
  const collection = db.collection('photos')
  collection.deleteOne({_id: new ObjectId(id)})
}