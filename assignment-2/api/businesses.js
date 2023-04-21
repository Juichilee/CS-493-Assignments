const router = require('express').Router();
const { validateAgainstSchema, extractValidFields } = require('../lib/validation');

const businesses = require('../data/businesses');
const { getDbInstance } = require('../lib/mongo')
 const { ObjectId } = require('mongodb')
const { reviews } = require('./reviews');
const { photos } = require('./photos');
const { ObjectID } = require('bson');

const { requireAuthentication } = require('../lib/auth')

exports.router = router;
exports.businesses = businesses;

/*
 * Schema describing required/optional fields of a business object.
 */
const businessSchema = {
  ownerid: { required: true },
  name: { required: true },
  address: { required: true },
  city: { required: true },
  state: { required: true },
  zip: { required: true },
  phone: { required: true },
  category: { required: true },
  subcategory: { required: true },
  website: { required: false },
  email: { required: false }
};

/*
 * Route to return a list of businesses.
 */
router.get('/', async function (req, res) {
  const db = getDbInstance()
  const collection = db.collection('businesses')
  /*
   * Compute page number based on optional query string parameter `page`.
   * Make sure page is within allowed bounds.
   */
  let page = parseInt(req.query.page) || 1;
  const numPerPage = 10;
  const lastPage = Math.ceil(collection.count() / numPerPage);
  page = page > lastPage ? lastPage : page;
  page = page < 1 ? 1 : page;

  /*
   * Calculate starting and ending indices of businesses on requested page and
   * slice out the corresponsing sub-array of busibesses.
   */
  const start = (page - 1) * numPerPage;
  const end = start + numPerPage;

  const pageBusinesses = await getAllBusinesses(start, numPerPage)

  //const pageBusinesses = businesses.slice(start, end);

  /*
   * Generate HATEOAS links for surrounding pages.
   */
  const links = {};
  if (page < lastPage) {
    links.nextPage = `/businesses?page=${page + 1}`;
    links.lastPage = `/businesses?page=${lastPage}`;
  }
  if (page > 1) {
    links.prevPage = `/businesses?page=${page - 1}`;
    links.firstPage = '/businesses?page=1';
  }

  /*
   * Construct and send response.
   */
  res.status(200).json({
    businesses: pageBusinesses,
    pageNumber: page,
    totalPages: lastPage,
    pageSize: numPerPage,
    totalCount: businesses.length,
    links: links
  });

});

/*
 * Route to create a new business.
 */
router.post('/', requireAuthentication, async function (req, res, next) {
  if (req.admin == false && req.user !== req.body.ownerid) {
    res.status(403).send({
        err: "Unauthorized to access the specified resource"
    })
    next()
  } else {
    if (validateAgainstSchema(req.body, businessSchema)) {
      try{
        const business = extractValidFields(req.body, businessSchema);
        const id = await insertNewBusiness(business)
        res.status(201).json({
          id: id, 
          links: {
            business: `/businesses/${id}`
          }
        });
      }catch(err){
        next()
      }
    } else {
      res.status(400).json({
        error: "Request body is not a valid business object"
      });
    }
  }
});

/*
 * Route to fetch info about a specific business.
 */
router.get('/:businessid', async function (req, res, next) {
  try{
    const businessid = req.params.businessid
    const business = await getBusinessById(businessid)
    res.status(200).json(business);
  }catch(err){
    next()
  }
});

/*
 * Route to replace data for a business.
 */
router.put('/', requireAuthentication, async function (req, res, next) {
  const businessid = req.body.businessid;
  if (req.admin == false && req.user !== req.body.ownerid) {
    res.status(403).send({
        err: "Unauthorized to access the specified resource"
    })
    next()
  } else {
    if (validateAgainstSchema(req.body, businessSchema)) {
      try{
        const newBusiness = extractValidFields(req.body, businessSchema);
        await modifyBusinessById(businessid, newBusiness)
        res.status(200).json({
          links: {
            business: `/businesses/${businessid}`
          }
        });
      }catch(err){
        next()
      }
      
    } else {
      res.status(400).json({
        error: "Request body is not a valid business object"
      });
    }
  }
});

/*
 * Route to delete a business.
 */
router.delete('/', requireAuthentication, async function (req, res, next) {
  const businessid = req.body.businessid;
  if (req.admin == false && req.user !== req.body.ownerid) {
    res.status(403).send({
        err: "Unauthorized to access the specified resource"
    })
    next()
  } else {
    try{
      await deleteBusiness(businessid)
    }catch(err){
      next()
    }
    res.status(204).end();
  }
});


// MongoDB Functions
async function insertNewBusiness(business){
  const db = getDbInstance()
  const collection = db.collection('businesses')
  business = extractValidFields(business, businessSchema)
  const result = await collection.insertOne(business)
  return result.insertedId
}

async function getAllBusinesses(start, numPerPage){
  const db = getDbInstance()
  const collection = db.collection('businesses')
  const businesses = await collection.find().skip(start).limit(numPerPage).toArray()
  return businesses
}

async function getBusinessById(id){

  const db = getDbInstance()
  const collection = db.collection('businesses')
  const businesses = await collection.aggregate([
    { $match: {_id: new ObjectId(id)}},
    { $lookup: {
      from: "photos",
      localField: "_id",
      foreignField: "businessid",
      as: "photos"
    }},
    { $lookup: {
      from: "reviews",
      localField: "_id",
      foreignField: "businessid",
      as: "reviews"
    }}
  ]).toArray()
  return businesses[0]
  
}

async function modifyBusinessById(id, newBusiness){
  const db = getDbInstance()
  const collection = db.collection('businesses')
  collection.updateOne({_id: new ObjectId(id)}, { $set: newBusiness})
}

async function deleteBusiness(id){
  const db = getDbInstance()
  const collection = db.collection('businesses')
  collection.deleteOne({_id: new ObjectId(id)})
}
