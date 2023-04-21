const express = require('express')
const app = express()
const port = process.env.PORT || 3000

app.use(express.json())

app.use(function (req, res, next) {
    console.log("== Request received")
    console.log("  - METHOD:", req.method)
    console.log("  - URL:", req.url)
    console.log("  - HEADERS:", req.headers)
    next()
})

app.get('/', function (req, res, next) {
    res.status(200).send({
        msg: "Home Page"
    })
})

// Gets all businesses in database
app.get('/businesses', function (req, res, next) {
    res.status(200).send({
        businesses: [
            {
                id: '1',
                name: 'Business 1',
                city: 'Corvallis',
                state: 'OR',
                zip: '97333',
                phone: '5031111111',
                category: 'Restaurant',
                subcategory: 'Pizza',
                website: 'https://business1.com',
                email: 'business1@gmail.com'
            },
            {
                id: '2',
                name: 'Business 2',
                city: 'Corvallis',
                state: 'OR',
                zip: '97333',
                phone: '5032222222',
                category: 'Restaurant',
                subcategory: 'Tacos',
                website: 'https://business2.com',
                email: 'business2@gmail.com'
            },
            {
                id: '3',
                name: 'Business 2',
                city: 'New York',
                state: 'New York',
                zip: '10001',
                phone: '5033333333',
                category: 'Finance',
                subcategory: 'Bank',
                website: 'https://business3.com',
                email: 'business3@gmail.com'
            }
        ],
        page: 1,
        total_pages: 300,
        page_size: 3,
        links:[{
            next_page: '/businesses?page=2'
        }]
    })
})

// Gets a specific business by id
app.get('/businesses/:id', function (req, res, next) {
    console.log("  - req.params:", req.params)
    const id = req.params.id
    if (id === '1') {
        res.status(200).send({
            id: '1',
            name: 'Business 1',
            city: 'Corvallis',
            state: 'OR',
            zip: '97333',
            phone: '5031111111',
            category: 'Restaurant',
            subcategory: 'Pizza',
            website: 'https://business1.com',
            email: 'business1@gmail.com',    
            links:[{
                reviews: '/businesses/id/reviews',
                photos: '/businesses/id/photos'
            }]
        })
    } else {
        next()
    }
})

// Gets all of the reviews of a specific business by id
app.get('/businesses/:id/reviews', function (req, res, next) {
    console.log("  - req.params:", req.params)
    const id = req.params.id
    if (id === '1') {
        res.status(200).send({
            id: '1',
            reviews:[
                {
                    review_id: 1,
                    star: '5',
                    dollar: '2',
                    written_review: 'The pizza here tastes great.'
                }
            ],
            page: 1,
            total_pages: 300,
            page_size: 3,
            links:[{
                next_page: '/businesses/id/reviews?page=2'
            }]
        })
    } else {
        next()
    }
})

// Gets all of the photos of a specific business by id
app.get('/businesses/:id/photos', function (req, res, next) {
    console.log("  - req.params:", req.params)
    const id = req.params.id
    if (id === '1') {
        res.status(200).send({
            id: '1',
            photos:[
                {
                    photo_id: 1,
                    p_url: "https://pineapple_pizza.png",
                    caption: 'Delicious Pineapple Pizza'
                }
            ],
            page: 1,
            total_pages: 300,
            page_size: 3,
            links:[{
                next_page: '/businesses/id/photos?page=2'
            }]
        })
    } else {
        next()
    }
})

// Creates a new business
app.post('/businesses', function (req, res, next) {
    console.log("  - req.body:", req.body)
    if (req.body && req.body.name && req.body.city && req.body.state && 
        req.body.zip && req.body.phone && req.body.category && req.body.subcategory) {
        /* Store data in database */
        res.status(201).send({
            id: '4'
        })
    } else {
        res.status(400).send({
            err: "Request needs a JSON body with `name`, `city`, `state`, `zip`, `phone`, `category`, and `subcategory`. 'website', and 'email' are optional."
        })
    }
})

// Updates an existing business by id
app.post('/businesses/:id', function (req, res, next) {
    console.log("  - req.body:", req.body)
    const id = req.params.id
    if(id == '1'){
        if (req.body && req.body.name && req.body.city && req.body.state && 
            req.body.zip && req.body.phone && req.body.category && req.body.subcategory) {
            /* Store data in database */
            res.status(201).send({
                id: id
            })
        } else {
            res.status(400).send({
                err: "Request needs a JSON body with `name`, `city`, `state`, `zip`, `phone`, `category`, and `subcategory`. 'website', and 'email' are optional."
            })
        }
    }else{
        next()
    }
})

// Deletes an existing business by id
app.delete('/businesses/:id', function(req, res, next){
    const id = req.params.id
    if(id == '1'){
        res.status(200).send({
            msg: 'DELETED business ' + id
        })
    }else{
        next()
    }
})

// Gets a specific review by id
app.get('/reviews/:id', function (req, res, next) {
    console.log("  - req.params:", req.params)
    const id = req.params.id
    if (id === '1') {
        res.status(200).send({
            review_id: 1,
            star: '5',
            dollar: '2',
            written_review: 'The pizza here tastes great.'
        })
    } else {
        next()
    }
})

// Creates a review for a business specified by business_id
app.post('/reviews', function (req, res, next) {
    console.log("  - req.body:", req.body)
    if (req.body && req.body.business_id && req.body.star && req.body.dollar && req.body.written_review) {
        /* Store data in database */
        res.status(201).send({
            id: '1'
        })
    } else {
        res.status(400).send({
            err: "Request needs a JSON body with `business_id`, `star`, `dollar`, and `written_review`,  ."
        })
    }
})

// Modifies a review by id for a business specified by business_id
app.post('/reviews/:id', function (req, res, next) {
    console.log("  - req.body:", req.body)
    const id = req.params.id
    if(id == '1'){
        if (req.body && req.body.business_id && req.body.star && req.body.dollar && req.body.written_review) {
            /* Store data in database */
            res.status(201).send({
                id: id
            })
        } else {
            res.status(400).send({
                err: "Request needs a JSON body with `business_id`, `star`, `dollar`, and `written_review`,  ."
            })
        }
    }else{
        next()
    }
})

// Deletes a review by id
app.delete('/reviews/:id', function(req, res, next){
    const id = req.params.id
    if(id == '1'){
        res.status(200).send({
            msg: 'DELETED review ' + id
        })
    }else{
        next();
    }
})

// Gets a photo by id
app.get('/photos/:id', function (req, res, next) {
    console.log("  - req.params:", req.params)
    const id = req.params.id
    if (id === '1') {
        res.status(200).send({
            photo_id: 1,
            p_url: "https://pineapple_pizza.png",
            caption: "Delicious Pineapple Pizza"
        })
    } else {
        next()
    }
})

// Creates a photo for a business specified by id
app.post('/photos', function (req, res, next) {
    console.log("  - req.body:", req.body)
    if (req.body && req.body.business_id && req.body.p_url && req.body.caption) {
        /* Store data in database */
        res.status(201).send({
            id: '1'
        })
    } else {
        res.status(400).send({
            err: "Request needs a JSON body with `business_id`, `p_url`, and `caption`."
        })
    }
})

// Modifies a photo's caption for a business by id
app.post('/photos/:id', function (req, res, next) {
    console.log("  - req.body:", req.body)
    const id = req.params.id
    if(id == '1'){
        if (req.body && req.body.business_id && req.body.caption) {
            /* Store data in database */
            res.status(201).send({
                id: id
            })
        } else {
            res.status(400).send({
                err: "Request needs a JSON body with `business_id`, and `caption`."
            })
        }
    }else{
        next()
    }
})

// Deletes a photo by id
app.delete('/photos/:id', function(req, res, next){
    const id = req.params.id
    if(id == '1'){
        res.status(200).send({
            msg: 'DELETED photo ' + id
        })
    }else{
        next();
    }
})

// Gets all of the businesses owned by a user by id
app.get('/users/:id/businesses', function(req, res, next){
    console.log("  - req.params:", req.params)
    const id = req.params.id
    if (id === '1') {
        res.status(200).send({
            businesses: [
                {
                    id: '1',
                    name: 'Business 1',
                    city: 'Corvallis',
                    state: 'OR',
                    zip: '97333',
                    phone: '5031111111',
                    category: 'Restaurant',
                    subcategory: 'Pizza',
                    website: 'https://business1.com',
                    email: 'business1@gmail.com'
                }
            ],
            page: 1,
            total_pages: 300,
            page_size: 3,
            links:[{
                next_page: '/users/id/businesses?page=2',
                user_reviews: '/users/id/reviews',
                user_photos: '/users/id/photos'
            }]
        })
    } else {
        next()
    }
})

// Gets all of the reviews owned by a user by id
app.get('/users/:id/reviews', function(req, res, next){
    console.log("  - req.params:", req.params)
    const id = req.params.id
    if (id === '1') {
        res.status(200).send({
            reviews:[
                {
                    review_id: 1,
                    star: '5',
                    dollar: '2',
                    written_review: 'The pizza here tastes great.'
                }
            ],
            page: 1,
            total_pages: 300,
            page_size: 3,
            links:[{
                next_page: '/users/id/reviews?page=2',
                user_businesses: '/users/id/businesses',
                user_photos: '/users/id/photos'
            }]
        })
    } else {
        next()
    }
})

// Gets all of the photos owned by a user by id
app.get('/users/:id/photos', function(req, res, next){
    console.log("  - req.params:", req.params)
    const id = req.params.id
    if (id === '1') {
        res.status(200).send({
            photos:[
                {
                    photo_id: 1,
                    p_url: "https://pineapple_pizza.png",
                    caption: 'Delicious Pineapple Pizza'
                }
            ],
            page: 1,
            total_pages: 300,
            page_size: 3,
            links:[{
                next_page: '/users/id/photos?page=2',
                user_reviews: '/users/id/reviews',
                user_businesess: '/users/id/businesses'
            }]
        })
    } else {
        next()
    }
})

app.use('*', function (req, res, next) {
    res.status(404).send({
        err: "This URL was not recognized: " + req.originalUrl
    })
})

app.use(function (err, req, res, next) {
    console.log("  - err:", err)
    res.status(500).send()
})

app.listen(port, function () {
    console.log("== Server is listening on port:", port)
})