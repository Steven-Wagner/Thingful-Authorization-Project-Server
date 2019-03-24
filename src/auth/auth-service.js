const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const config = require('../config')

const AuthService = {
    parseBasicToken(token) {
        return Buffer
            .from(token, 'base64')
            .toString()
            .split(':')
    },

    getUser(knex, user_name) {
        return knex('thingful_users')
            .where({user_name})   
            .first()       
    },
    comparePasswords(password, hash) {
        return bcrypt.compare(password, hash)
    },
    createJwt(subject, payload) {
        return jwt.sign(payload, config.JWT_SECRET, {
            //may be wrong check if token validations seem to be failing
            subject: subject,
            algorithm: 'HS256'
        })
    },
    verifyToken(token) {
        return jwt.verify(token, config.JWT_SECRET, {
            algorithms: ['HS256']
        })
    }
}

module.exports = AuthService