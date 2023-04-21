const router = require('express').Router();

exports.router = router;

const { getDbInstance } = require('../lib/mongo')
const { ObjectId } = require('mongodb')
const bcrypt = require('bcryptjs')

const { validateAgainstSchema, extractValidFields } = require('../lib/validation');
const { getDBReference } = require('../lib/mongo')
const { generateAuthToken, requireAuthentication } = require('../lib/auth')


/*
 * Schema for a User.
 */
const UserSchema = {
  name: { required: true },
  email: { required: true },
  password: { required: true },
  admin: {required: true}
}


/*
 * Route to list all of a user's businesses.
 */
router.get('/:userid/businesses', requireAuthentication, async function (req, res, next) {
  const userid = req.params.userid
  if (req.user !== req.params.userid) {
    res.status(403).send({
        err: "Unauthorized to access the specified resource"
    })
    next()
  } else {
    const userBusinesses = await getUserBusinesses(userid)
    res.status(200).json({
      businesses: userBusinesses
    });
  }
});

/*
 * Route to list all of a user's reviews.
 */
router.get('/:userid/reviews', requireAuthentication, async function (req, res, next) {
  const userid = req.params.userid
  if (req.user !== req.params.userid) {
    res.status(403).send({
        err: "Unauthorized to access the specified resource"
    })
    next()
  } else {
    const userReviews = await getUserReviews(userid)

    res.status(200).json({
      reviews: userReviews
    });
  }
});

/*
 * Route to list all of a user's photos.
 */
router.get('/:userid/photos', requireAuthentication, async function (req, res, next) {
  const userid = req.params.userid
  if (req.user !== req.params.userid) {
    res.status(403).send({
        err: "Unauthorized to access the specified resource"
    })
    next()
  } else {
    const userPhotos = await getUserPhotos(userid)

    res.status(200).json({
      photos: userPhotos
    });
  }
});

async function getUserBusinesses(id){
  const db = getDbInstance()
  const collection = db.collection('businesses')
  const businesses = await collection.find({ownerid: id}).toArray()
  return businesses
}

async function getUserReviews(id){
  const db = getDbInstance()
  const collection = db.collection('reviews')
  const reviews = await collection.find({userid: id}).toArray()
  return reviews
}

async function getUserPhotos(id){
  const db = getDbInstance()
  const collection = db.collection('photos')
  const photos = await collection.find({userid: id}).toArray()
  return photos
}

/*
* API routes for 'users' collection.
*/
router.post('/instantiate_admin', async function (req, res) {
  console.log("REGISTERING ADMIN\n")
  if (validateAgainstSchema(req.body, UserSchema)) {
    const id = await insertNewUser(req.body)
    res.status(201).send({
      _id: id
    })
  } else {
    res.status(400).send({
      error: "Request body does not contain a valid User."
    })
  }
})

router.post('/', requireAuthentication, async function (req, res, next) {
  if (req.body.admin == true && req.admin == false) {
    res.status(403).send({
        err: "Unauthorized to access the specified resource"
    })
    next()
  } else {
    if (validateAgainstSchema(req.body, UserSchema)) {
      const id = await insertNewUser(req.body)
      res.status(201).send({
        _id: id
      })
    } else {
      res.status(400).send({
        error: "Request body does not contain a valid User."
      })
    }
  }
})

router.post('/login', async function (req, res) {
  if (req.body && req.body.id && req.body.password) {
    const user = await getUserById(req.body.id, true)
    const authenticated = user && await bcrypt.compare(
        req.body.password,
        user.password
    )
    if (authenticated) {
      const token = generateAuthToken(req.body.id, user.admin)
      res.status(200).send({ token: token })
    } else {
      res.status(401).send({
          error: "Invalid credentials"
      })
    }
  } else {
    res.status(400).send({
      error: "Request needs user ID and password."
    })
  }
})

router.get('/:id', requireAuthentication, async function (req, res, next) {
  console.log("== req.user:", req.user)
  console.log("== req.admin:", req.admin)
  if (req.admin == false && req.user !== req.params.id) {
    res.status(403).send({
        err: "Unauthorized to access the specified resource"
    })
    next()
  } else {
    const user = await getUserById(req.params.id)
    console.log("== req.headers:", req.headers)
    if (user) {
      res.status(200).send(user)
    } else {
      next()
    }
  }
})

/*
 * Insert a new User into the DB.
 */
async function insertNewUser(user) {
  const userToInsert = extractValidFields(user, UserSchema)
  userToInsert.password = await bcrypt.hash(userToInsert.password, 8)
  console.log("== Hashed, salted password:", userToInsert.password)
  const db = getDbInstance()
  const collection = db.collection('users')
  const result = await collection.insertOne(userToInsert)
  return result.insertedId
}


/*
* Fetch a user from the DB based on user ID.
*/
async function getUserById(id, includePassword) {
  const db = getDbInstance()
  const collection = db.collection('users')
  if (!ObjectId.isValid(id)) {
    return null
  } else {
    const results = await collection
    .find({ _id: new ObjectId(id) })
    .project(includePassword ? {} : { password: 0 })
    .toArray()
    return results[0]
  }
}