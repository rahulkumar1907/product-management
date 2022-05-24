const userModel = require('../model/userModel')
const mongoose = require("mongoose")
const bcrypt = require("bcrypt")
const aws = require("aws-sdk")

//to check validation 
const isValid = (value) => {
    if(typeof value === 'undefined' || typeof value === 'null') return false
    if(typeof value === 'string' && string.trim().length === 0) return false
    return true
}

//to check validation of objectId
const isValidOjectId = (objectId) => {
    return mongoose.isValidObjectId(objectId)
}



//to create userRegistration
const userRegister = async (req, res) => {
    data = json.parse(req.body)
//aws -files
//bcrypt - bcrypt.hash
}

//to login user
const userLogin = async (req, res) => {

    //bcrypt.compare
}

//to get user information
const getUser = async (req, res) => {

}

//to update user information
const updateUser = async (req, res) => {

}

module.exports = {userRegister,userLogin,getUser,updateUser}
 