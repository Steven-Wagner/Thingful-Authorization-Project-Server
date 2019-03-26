const knex = require('knex')
const app = require('../src/app')
const helpers = require('./test-helpers')

describe('Things Endpoints', function() {
  let db

  const {
    testUsers,
    testThings,
    testReviews,
  } = helpers.makeThingsFixtures()

  before('make knex instance', () => {
    db = knex({
      client: 'pg',
      connection: process.env.TEST_DB_URL,
    })
    app.set('db', db)
  })

  after('disconnect from db', () => db.destroy())

  before('cleanup', () => helpers.cleanTables(db))

  afterEach('cleanup', () => helpers.cleanTables(db))

  const protectedEndpoints = [
    {
      name: 'GET /api/things/:thing_id',
      path: '/api/things/1',
      method: supertest(app).get
    },
    {
      name: 'GET /api/things/:thing_id/reviews',
      path: '/api/things/1/reviews',
      method: supertest(app).get
    },
    {
      name: 'POST /api/reviews',
      path: '/api/reviews',
      method: supertest(app).post
    }
  ]

  protectedEndpoints.forEach(endpoint => {

    describe(endpoint.name, () => {
      beforeEach('insert things', () =>
          helpers.seedThingsTables(
          db,
          testUsers,
          testThings,
          testReviews,
          )
      )
      it(`responds with 401 'missing bearer token'`, () => {
          const badUser = {user_name: 'Steve', password: ''}
          return endpoint.method(endpoint.path)
            .set('Authorization', badUser)
            .expect(401, {error: 'Missing bearer token'})
      })
      it(`responds with 401 with bad secret`, () => {
          const validUser = testUsers[0]
          const badSecret = 'bad-secret'
          return endpoint.method(endpoint.path)
            .set('Authorization', helpers.makeAuthHeader(validUser, badSecret))
            .expect(401, {error: `Unauthorized request`})
      })
      it(`responds with 401 with invalid user in sub payload`, () => {
          const validUser = {user_name: 'bad-user', id: 1}
          return endpoint.method(endpoint.path)
            .set('Authorization', helpers.makeAuthHeader(validUser))
            .expect(401, {error: `Unauthorized request`})
      })
    })
  })
})