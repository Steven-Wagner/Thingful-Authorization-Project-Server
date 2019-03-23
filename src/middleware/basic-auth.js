const AuthService = require('../auth/auth-service')

function requireAuth(req, res, next) {
    const authToken = req.get('authorization') || ''

    let bearerToken

    if (!authToken.toLowerCase().startsWith('bearer ')) {
        return res.status(401).json({error: 'Missing bearer token'})
    }
    else {
        bearerToken = authToken.slice(7, authToken.length)
    }

    const [tokenUserName, tokenUserPassword] = AuthService.parseBasicToken(bearerToken)

    if (!tokenUserName || !tokenUserPassword) {
        return res.status(401).json({ error: 'Unauthorized request' })
      }
    AuthService.getUser(
        req.app.get('db'),
        tokenUserName
    )
    .then(userData => {

        if (!userData) {
            return res.status(401).json({error: 'user does not exist'})
        }

        if (tokenUserPassword !== userData.password) {
            return res.status(401).json({error:'Invalid password'})
        }

        req.user = userData

        next()
    })
    .catch(next)

}

module.exports = {
    requireAuth
}