const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");

const auth = function (req, res, next) {
    try {
        let token = req.headers["x-api-key"] || req.headers["x-Api-key"];
    if (!token) return res.status(400).send({ status: false, message: "Token is not present" });

    let decodedToken = jwt.verify(token,'shoppingCart',function (err, token) {
        if(err){
            return res.status(400).send({ status: false, message: "Invalid User"})
        }else{
            req.userId = decodedToken.userId;
            next()
        }
    })

    } catch (error) {
       return res.status(500).send({status:false, message: error.message}) 
    }
    
   

};

module.exports = auth