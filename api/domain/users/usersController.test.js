const usersController = require('./usersController')
const createUser = require('./createUser')
const InviteCode = require('../inviteCodes/InviteCode')
const agent = require('../../tests/agent')
const clock = require('../../tests/clock')
const signIn = require('../../tests/signIn')
const expect = require('chai').expect
const sinon = require('sinon')

describe('usersController', function () {
  var sandbox

  beforeEach(function () {
    sandbox = sinon.sandbox.create()
  })

  afterEach(function () {
    sandbox.restore()
  })

  clock()

  describe('POST /api/users', function () {
    describe('when createUser succeeds', function () {
      beforeEach(function () {
        sandbox.spy(createUser, 'createUser')
      })

      it('should invoke createUser', function () {
        const postBody = {
          username: 'turkish',
          email: 'edgar@allen.poe',
          password: 'allegory',
          password2: 'fighter',
          inviteCode: 'cashmere'
        }
        return agent()
          .post('/api/users')
          .accept('application/json')
          .send(postBody)
          .then(function () {
            expect(createUser.createUser).to.have.been.calledWith(postBody)
          })
      })

      it('should return user and sign me in', function () {
        return InviteCode.create({ code: 'cashmere' })
          .then(function () {
            return agent()
              .post('/api/users')
              .accept('application/json')
              .send({
                username: 'turkish',
                email: 'austin@baustin.com',
                password: 'allegory',
                password2: 'allegory',
                inviteCode: 'cashmere'
              })
              .expect(200, {
                ok: true,
                user: {
                  id: 1,
                  username:  'turkish',
                  email: 'austin@baustin.com',
                  createdAt: 'Thu, 31 Aug 2017 00:00:00 GMT',
                  updatedAt: 'Thu, 31 Aug 2017 00:00:00 GMT',
                }
              })
              .expect(function (res) {
                expect(res.headers).to.have.property('set-cookie')
              })
          })
      })

      it('should return errors', function () {
        return agent()
          .post('/api/users')
          .accept('application/json')
          .send({ username: 'hey', email: 'b@p.com', password: 'austin', password2: 'austin' })
          .expect(422, {
            ok: false,
            errors: [{ code: 'NONEXISTANT_INVITE' }]
          })
      })
    })

    it('when createUser rejects should return 500', function () {
      sandbox.stub(createUser, 'createUser').rejects()

      return agent()
        .post('/api/users')
        .accept('application/json')
        .send({ username: 'hey', password: 'austin', password2: 'austin' })
        .expect(500, {
          ok: false
        })
    })
  })

  describe('GET /api/users/me', function () {
    it('when signed out should 403', function () {
      return agent()
        .get('/api/users/me')
        .accept('application/json')
        .redirects(0)
        .expect(403)
    })

    describe('when signed in', function () {
      beforeEach(function () {
        return signIn({ username: 'sasquatch', email: 'austin@baustin.com' })
      })

      it('should return my user on sign in', function () {
        return agent()
          .get('/api/users/me')
          .accept('application/json')
          .cookiejar()
          .redirects(0)
          .expect(200, {
            id: 1,
            username: 'sasquatch',
            email: 'austin@baustin.com',
            createdAt: 'Thu, 31 Aug 2017 00:00:00 GMT',
            updatedAt: 'Thu, 31 Aug 2017 00:00:00 GMT',
          })
      })
    })
  })

  describe('PUT /api/users/me', function () {
    beforeEach(function () {
      return signIn()
    })

    it('should change username', function () {
      return agent()
        .put('/api/users/me')
        .accept('application/json')
        .cookiejar()
        .send({ username: 'elizabeth' })
        .expect(200, {
          ok: true,
          user: {
            id: 1,
            email: signIn.user.email,
            createdAt: 'Thu, 31 Aug 2017 00:00:00 GMT',
            updatedAt: 'Thu, 31 Aug 2017 00:00:00 GMT',
            username: 'elizabeth'
          }
        })
    })
  })
})
