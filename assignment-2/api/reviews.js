const router = require('express').Router();
const { validateAgainstSchema, extractValidFields } = require('../lib/validation');

const { getDbInstance } = require('../lib/mongo')
 const { ObjectId } = require('mongodb')
const reviews = require('../data/reviews');

const { requireAuthentication } = require('../lib/auth')

exports.router = router;
exports.reviews = reviews;

/*
 * Schema describing required/optional fields of a review object.
 */
const reviewSchema = {
  userid: { required: true },
  businessid: { required: true },
  dollars: { required: true },
  stars: { required: true },
  review: { required: false }
};


/*
 * Route to create a new review.
 */
router.post('/', requireAuthentication, async function (req, res, next) {
  if (req.admin == false && req.user !== req.body.userid) {
    res.status(403).send({
        err: "Unauthorized to access the specified resource"
    })
    next()
  } else {
    if (validateAgainstSchema(req.body, reviewSchema)) {
      const review = extractValidFields(req.body, reviewSchema);

      /*
      * Make sure the user is not trying to review the same business twice.
      */
      console.log("CHECKING REVIEW")
      const alreadyReviewed = await checkAlreadyReviewed(review.userid, review.businessid)
      console.log("CHECKING VAL: " + alreadyReviewed)
      try{
        if (alreadyReviewed) {
          res.status(403).json({
            error: "User has already posted a review of this business"
          });
        } else {

          review.businessid = new ObjectId(review.businessid)
          const reviewId = await insertNewReview(review)

          res.status(201).json({
            id: reviewId,
            links: {
              review: `/reviews/${reviewId}`,
              business: `/businesses/${review.businessid}`
            }
          });
        }
      }catch(err){
        next()
      }
    } else {
      res.status(400).json({
        error: "Request body is not a valid review object"
      });
    }
  }
});

/*
 * Route to fetch info about a specific review.
 */
router.get('/:reviewID', async function (req, res, next) {
  const reviewID = req.params.reviewID
  try{
    const reviews = await getReviewById(reviewID)
    res.status(200).json(reviews);
  }catch(err){
    next()
  }
});

/*
 * Route to update a review.
 */
router.put('/', requireAuthentication, async function (req, res, next) {
  const reviewID = req.body.reviewid
  if (req.admin == false && req.user !== req.body.userid) {
    res.status(403).send({
        err: "Unauthorized to access the specified resource"
    })
    next()
  } else {
    if (validateAgainstSchema(req.body, reviewSchema)) {
        /*
        * Make sure the updated review has the same businessid and userid as
        * the existing review.
        */
        try{
          let updatedReview = extractValidFields(req.body, reviewSchema);
          const existingReview = await getReviewById(reviewID)

          if (updatedReview.businessid === existingReview.businessid.toString() && updatedReview.userid === existingReview.userid) {
            await modifyReviewById(reviewID, updatedReview)

            res.status(200).json({
              links: {
                review: `/reviews/${reviewID}`,
                business: `/businesses/${updatedReview.businessid}`
              }
            });
          } else {
            res.status(403).json({
              error: "Updated review cannot modify businessid or userid"
            });
          }
        }catch(err){
          next()
        }
      } else {
        res.status(400).json({
          error: "Request body is not a valid review object"
        });
      }
  }
});

/*
 * Route to delete a review.
 */
router.delete('/', requireAuthentication, async function (req, res, next) {
  const reviewID = req.body.reviewid
  if (req.admin == false && req.user !== req.body.userid) {
    res.status(403).send({
        err: "Unauthorized to access the specified resource"
    })
    next()
  } else {
    try{
      await deleteReview(reviewID)
      res.status(204).end();
    }catch(err){
      next()
    }
  }
});

// MongoDB Functions
async function insertNewReview(review){
  const db = getDbInstance()
  const collection = db.collection('reviews')
  const result = await collection.insertOne(review)
  return result.insertedId
}

async function getReviewById(id){
  const db = getDbInstance()
  const collection = db.collection('reviews')
  const reviews = await collection.aggregate([
    { $match: {_id: new ObjectId(id)}}
  ]).toArray()
  return reviews[0]
}

async function modifyReviewById(id, newReview){
  const db = getDbInstance()
  const collection = db.collection('reviews')
  collection.updateOne({_id: new ObjectId(id)}, { $set: newReview}, function(err, res){
    if(err){
      throw err
    }
  })
}

async function deleteReview(id){
  const db = getDbInstance()
  const collection = db.collection('reviews')
  collection.deleteOne({_id: new ObjectId(id)})
}

async function checkAlreadyReviewed(userid, businessid){
  const db = getDbInstance()
  const collection = db.collection('reviews')

  const reviews = await collection.aggregate([
    { $match: {userid: userid, businessid: new ObjectId(businessid)}}
  ]).toArray()
  if(Object.keys(reviews) != 0){
    return true
  }
  return false
}