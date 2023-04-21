const { Router } = require('express')
const router = Router()

const queue = 'photos'

const {
  getImageInfoById,
  saveImageInfo,
  saveImageFile,
  getDownloadStreamByFilename
} = require('../models/image');

const { getChannel } = require('../lib/rabbitmq')

const fileTypes = {
  'image/jpeg' : 'jpg',
  'image/png' : 'png'
}

router.get('/photos/:filename', function (req, res, next) {
    getDownloadStreamByFilename(req.params.filename, 'photos')
    .on('file', function (file) {
        res.status(200).type(file.metadata.mimetype)
    })
    .on('error', function (err) {
        if (err.code === 'ENOENT') {
            next()
        } else {
            next(err)
        }   
    })
    .pipe(res)
})

router.get('/thumbs/:filename', function (req, res, next) {
    getDownloadStreamByFilename(req.params.filename, 'thumbs')
    .on('file', function (file) {
        // console.log("FILENAME: ", file.metadata.filename)
        // console.log("MIMETYPE: ", file.metadata.mimetype)
        res.status(200).type('image/jpeg')
    })
    .on('error', function (err) {
        if (err.code === 'ENOENT') {
            next()
        } else {
            next(err)
        }   
    })
    .pipe(res)
})

module.exports = router