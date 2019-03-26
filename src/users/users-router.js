const express = require('express')
const UserService = require('./user-service')
const path = require('path')

const usersRouter = express.Router()
const jsonBodyParser = express.json()

usersRouter
    .post('/', jsonBodyParser, (req, res, next) => {
        const {password, user_name, full_name, nickname} = req.body

        for (const field of ['user_name', 'password', 'full_name']) {
            if (!req.body[field]) {
                return res.status(400).json({
                    error: `Missing ${field} in request body`
                })
            }
        }
        
        const passwordError = UserService.validatePassword(password)

        if (passwordError) {
            return res.status(400).json({error: passwordError})
        }

        UserService.UserExists(
            req.app.get('db'),
            user_name
        )
        .then(userExists => {
            if(userExists) {
                return res.status(400).json({
                    error: `User already exists`
                })
            }

            return UserService.hashPassword(password)
            .then(hashedPassword => {
                const newUser = {
                    user_name: user_name,
                    full_name: full_name,
                    nickname: nickname,
                    password: hashedPassword,
                    date_created: 'now()'
                }

                return UserService.insertUser(
                    req.app.get('db'),
                    newUser
                )
                .then(user => {
                    res
                        .status(201)
                        .location(path.posix.join(req.originalUrl, `/${user.id}`))
                        .json(UserService.serializeUser(user))
                })
            })
        })
        .catch(next)
    })

module.exports = usersRouter