const Audio = require('./Audio')
const AudioCreator = require('./AudioCreator')
const updateAudio = require('./updateAudio')
const deleteAudio = require('./deleteAudio')
const findAudio = require('./findAudio')
const { getStorageStrategy } = require('./storageStrategies')

module.exports.index = function (req, res, next) {
  Audio.findAll({ where: { userId: req.user.id, deletedAt: null } })
    .then(function (records) {
      return Promise.all(records.map(r => r.toJSON()))
    })
    .then(function (records) {
      return res.status(200).json({ ok: true, records })
    })
    .catch(next)
}

module.exports.get = function (req, res, next) {
  if (req.path === '/favicon.ico') {
    return next()
  }
  const pathComponents = req.path.split('/')

  if (req.subdomains.length === 1) {
    const url = pathComponents[1]
    const isDownload = pathComponents[2] && pathComponents[2] === 'download'
    const username = req.subdomains[0]

    return findAudio.findAudio({
      url,
      username,
      user: req.user
    })
      .then(function (audio) {
        const strategy = getStorageStrategy()

        res.writeHead(200, {
          'Content-Type': audio.mimetype,
          'Content-Length': audio.size
        })

        return strategy.getStream(audio, isDownload)
      })
      .then(stream => stream.on('error', next).pipe(res))
      .catch(function (err) {
        if (err.name !== 'AudioNotFoundError') {
          return next(err)
        }
        return next()
      })
  } else {
    return next()
  }
}

module.exports.delete = function (req, res, next) {
  const id = parseInt(req.params.id, 10)

  Audio.findOne({ where: { id } })
    .then(record => deleteAudio.deleteAudio(req.user, record))
    .then(function (audio) {
      return res.status(202).json({ ok: true })
    })
    .catch(function (err) {
      if (err.name === 'AudioDeleteError') {
        return res.status(422).json({ ok: false, errors: [err.toJSON()] })
      }
      return next(err)
    })
}

module.exports.create = function (req, res, next) {
  return new AudioCreator()
    .perform({ file: req.file, user: req.user })
    .then(audio => audio.toJSON())
    .then(function (audio) {
      return res.status(201).json({ ok: true, audio })
    })
    .catch(function (err) {
      if (err.name === 'AudioCreationError') {
        return res.status(422).json({ ok: false, errors: [err.toJSON()] })
      }
      return next(err)
    })
}

module.exports.update = function (req, res, next) {
  const id = parseInt(req.params.id, 10)

  Audio.findOne({ where: { id } })
    .then(record => updateAudio.updateAudio(req.user, record, req.body))
    .then(audio => audio.toJSON())
    .then(function (audio) {
      return res.status(202).json({ ok: true, audio })
    })
    .catch(function (err) {
      if (err.name === 'AudioUpdateError') {
        return res.status(422).json({ ok: false, errors: [err.toJSON()] })
      }
      return next(err)
    })
}
