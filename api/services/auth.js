const passport = require('passport')
const LocalStrategy = require('passport-local').Strategy
const passwordUtils = require('../domain/users/passwords')
const User = require('../domain/users/User')

passport.use(new LocalStrategy(
  function (username, password, done) {
    let user

    User.findOne({ where: { username } }).then(function (record) {
      user = record

      if (!user) {
        return null
      }
      return passwordUtils.verify(password, user.password)
    })
      .then(function (success) {
        return done(null, success ? user : false)
      })
      .catch(function (err) {
        return done(err)
      })
  }
))

passport.serializeUser(function (user, done) {
  return done(null, user.get('id'))
})

passport.deserializeUser(function (id, done) {
  User.findOne({ where: { id: id } }).then(function (user) {
    return done(null, user)
  })
    .catch(done)
})

module.exports.authenticate = function (callback) {
  return passport.authenticate('local', callback)
}
