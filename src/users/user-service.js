const REGEX_UPPER_LOWER_NUMBER_SPECIAL = /(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&])[\S]+/
const bcrypt = require('bcryptjs')
const xss = require('xss')

const UserService = {
    validatePassword(password) {
        if (password.length < 8) {
            return `Password must be 8 or longer`
        }            
        if (password.length > 72) {
            return `Passowrd must be shorter than 73`
        }
        if (password.startsWith(' ') || password.endsWith(' ')) {
            return `Password can not start or end with spaces`
        }
        if (!REGEX_UPPER_LOWER_NUMBER_SPECIAL.test(password)) {
            return (`Password must contain 1 upper case, lowre case, number, and special character`)
        }
    },
    UserExists(db, user_name) {
        return db('thingful_users')
            .where({user_name})
            .first()
            .then(user => !!user)
    },
    hashPassword(password) {
        return bcrypt.hash(password, 12)
    },
    insertUser(db, newUser) {
        return db('thingful_users')
            .insert(newUser)
            .returning('*')
            .then(([user]) => user)
    },
    serializeUser(user) {
        return {
            id: user.id,
            user_name: xss(user.user_name),
            full_name: xss(user.full_name),
            nickname: xss(user.nickname),
            date_created: new Date(user.date_created)
        }
    }
}

module.exports = UserService