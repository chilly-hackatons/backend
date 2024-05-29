// const jwt = require('jsonwebToken');


// class TokenService {
//     generateTokens(payload) {
//         const accessToken = jwt.sign(payload, process.env.JWT-ACCESS-SECRET, {expiresIn:'2m'})
//         const refreshToken = jwt.sign(payload, process.env.JWT-REFRESH-SECRET, {expiresIn:'30d'})
//         return{
//             accessToken,
//             refreshToken
//         }
//     }
// } //создание ацесс и рефреш токенов

// module.exports = new TokenService();