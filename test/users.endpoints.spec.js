const knex = require('knex')
const app = require('../src/app')
const helpers = require('./test-helpers')
const bcrypt = require('bcryptjs')

describe('Auth Endpoints', function() {
    let db

    const {
      testThings,
      testUsers,
    } = helpers.makeThingsFixtures()
    const testUser = testUsers[0]
  
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

    describe(`POST /api/users`, () => {
        context(`users validation`, () => {
            beforeEach('insert users', () => 
                helpers.seedUsers(
                    db,
                    testUsers
                )
            )

            const requiredFields = ['user_name', 'password', 'full_name']
            
            requiredFields.forEach(field => {
                const badNewUser = {
                    user_name: 'test user_name',
                    password: 'test_passoword',
                    full_name: 'test Full Name',
                    nickname: 'test nickname'
                }
                it(`resoonds with 400 when ${field} is missing`, () => {
                    delete badNewUser[field]
                    
                    return supertest(app)
                        .post('/api/users')
                        .send(badNewUser)
                        .expect(400, {error: `Missing ${field} in request body`})
                })
            })

            it(`responds 400 when password is less than 8 charcters`, () => {
                const badNewUser = {
                    user_name: 'test user_name',
                    password: '1234567',
                    full_name: 'test Full Name',
                    nickname: 'test nickname'
                }
                return supertest(app)
                    .post('/api/users')
                    .send(badNewUser)
                    .expect(400, {error: `Password must be 8 or longer`})
            })
            it(`responds 400 when password is more than 72 charcters`, () => {
                const badNewUser = {
                    user_name: 'test user_name',
                    password: '*'.repeat(73),
                    full_name: 'test Full Name',
                    nickname: 'test nickname'
                }
                return supertest(app)
                    .post('/api/users')
                    .send(badNewUser)
                    .expect(400, {error: `Passowrd must be shorter than 73`})
            })

            for (const startOrEnd of [['starts', '  startwithspace'], ['ends', 'endswithspace  ']]) {
            
                it(`responds 400 when password ${startOrEnd[0]} with spaces`, () => {
                    const badNewUser = {
                        user_name: 'test user_name',
                        password: `${startOrEnd[1]}`,
                        full_name: 'test Full Name',
                        nickname: 'test nickname'
                    }
                    return supertest(app)
                        .post('/api/users')
                        .send(badNewUser)
                        .expect(400, {error: `Password can not start or end with spaces`})
                })
            }

            it(`responds with 400 when password is not complex`, () => {
                const badPasswordUser = {
                    user_name: 'test user_name',
                    password: `11AAaa11`,
                    full_name: 'test Full Name',
                    nickname: 'test nickname'
                }
                return supertest(app)
                    .post('/api/users')
                    .send(badPasswordUser)
                    .expect(400, {error: `Password must contain 1 upper case, lowre case, number, and special character`})
            })

            it(`responds 400 when user already exists`, () => {
                const duplicateUser = {
                    user_name: testUser.user_name,
                    password: '11AAaa!!',
                    full_name: 'Full Name',
                    nickname: 'test nick_name'
                }
                return supertest(app)
                    .post('/api/users')
                    .send(duplicateUser)
                    .expect(400, {
                        error: `User already exists`
                    })
            })
        })
        context('happy path', () => {
            it('responds with 201, serialized user, storing hashed password', () => {
                const newUser = {
                    user_name: 'Test user_name',
                    password: '11AAaa!!',
                    full_name: 'test Full_name'
                }
                return supertest(app)
                  .post('/api/users')
                  .send(newUser)
                  .expect(201)
                  .expect(res => {
                      expect(res.body).to.have.property('id')
                      expect(res.body.user_name).to.eql(newUser.user_name)
                      expect(res.body.nickname).to.eql('')
                      expect(res.body).to.not.have.property('password')
                      expect(res.headers.location).to.eql(`/api/users/${res.body.id}`)
                      const expectedDate = new Date().toLocaleString()
                      const actualDate = new Date(res.body.date_created).toLocaleString()
                      expect(res.body.full_name).to.eql(newUser.full_name)
                      expect(actualDate).to.eql(expectedDate)
                  })
                  .expect(res => {
                      db
                          .from('thingful_users')
                          .select('*')
                          .where({id: res.body.id})
                          .first()
                          .then(row => {
                              expect(row.user_name).to.eql(newUser.user_name)
                              expect(row.full_name).to.eql(newUser.full_name)
                              expect(row.nickname).to.eql(null)
                              const expectedDate = new Date().toLocaleString()
                              const actualDate = new Date(row.date_created).toLocaleString()
                              expect(actualDate).to.eql(expectedDate)
  
                              return bcrypt.compare(newUser.password, row.password)
                          })
                          .then(compareMatch => {
                              expect(compareMatch).to.be.true
                          })
                  })
            })
        })
    })
})