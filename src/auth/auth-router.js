const express = require('express')
const AuthService = require('./auth-service')

const authRouter = express.Router()
const jsonBodyParser = express.json()

authRouter
    .post('/login', jsonBodyParser, (req, res, next) => {
        const {user_name, password} = req.body
        const loginUser = {user_name, password}

        for (const[key, value] of Object.entries(loginUser)) {
            if (value == null) {
                return res.status(400).json({
                    error: `Missing '${key}' in request body`
                })
            }
        }
        AuthService.getUser(
            req.app.get('db'),
            loginUser.user_name
        )
        .then(user => {
            if (!user) {
                return res.status(400).json({
                    error: `Incorrect user_name or password`
                })
            }
            return AuthService.comparePasswords(loginUser.password, user.password)
                .then(compareMatch => {
                    if (!compareMatch) {
                        return res.status(400).json({
                            error: `Incorrect user_name or password`
                        })
                    }
                    //may be wrong check if token validations seem to be failing
                    res.send({authToken: AuthService.createJwt(user.user_name, {user_id: user.id})
                    })
                })
        })        
        .catch(next)
    })
module.exports = authRouter