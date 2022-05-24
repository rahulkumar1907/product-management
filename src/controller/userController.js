const userModel = require('../model/userModel')
const bcrypt = require("bcrypt")
const uploadFile = require('./awsController')
const mongoose = require('mongoose')
const jwt = require('jsonwebtoken')
let saltRounds = 10

/**********************Global validation*****************************/
//to check validation 
const isValid = (value) => {
    if (typeof value === 'undefined' || typeof value === 'null') return false
    if (typeof value === 'string' && value.trim().length === 0) return false
    return true;
}

const isValidRequestBody = (requestBody) => {
    return Object.keys(requestBody).length > 0
}

const isValidPassword = (password) => {
    if (password.length > 7 && password.length < 16)
        return true
}

const isValidFiles = (files) => {
    if (files && files.length > 0)
        return true
}

//to check validation of objectId
const isValidOjectId = (objectId) => {
    return mongoose.isValidObjectId(objectId)
}


/*************Create User (1st Api)*******************************/
const userRegister = async (req, res) => {
    try {
        let data = req.body

        if (!isValidRequestBody(data)) return res.status(400).send({ status: false, message: "Invalid request. please provide details." })

        const { fname, lname, email, phone, password, address } = data;

        const files = req.files
        if (!isValidFiles(files)) return res.status(400).send({ status: false, Message: "Please provide user's profile picture" })

        if (!isValid(fname)) return res.status(400).send({ status: false, Message: "Please provide your first name" })
        if (!fname.trim().match(/^[a-zA-Z ]{2,30}$/)) return res.status(400).send({ status: false, message: "Firstname should only contain alphabet" })
        
        if (!isValid(lname)) return res.status(400).send({ status: false, Message: "Please provide your last name" })
        if (!lname.trim().match(/^[a-zA-Z ]{2,30}$/)) return res.status(400).send({ status: false, message: "lastname should only contain alphabet" })

        if (!isValid(email)) return res.status(400).send({ status: false, Message: "Please provide your email address" })

        if (!isValid(phone)) return res.status(400).send({ status: false, Message: "Please provide your valid phone number" })

        if (!isValid(password)) return res.status(400).send({ status: false, Message: "Please provide your password" })

        if (!isValid(address)) return res.status(400).send({ status: false, Message: "Please provide your address" })

        let jsonAddress = JSON.parse(address);
        
        if (jsonAddress) {
            if (jsonAddress.shipping) {
                if (!isValid(jsonAddress.shipping.street)) return res.status(400).send({ status: false, Message: "Please provide your street name in shipping address" })

                if (!isValid(jsonAddress.shipping.city)) return res.status(400).send({ status: false, Message: "Please provide your city name in shipping address" })

                if (!isValid(jsonAddress.shipping.pincode)) return res.status(400).send({ status: false, Message: "Please provide your pin code in shipping address" })

            }

            if (jsonAddress.billing) {
                if (!isValid(jsonAddress.billing.street)) return res.status(400).send({ status: false, Message: "Please provide your street name in billing address" })

                if (!isValid(jsonAddress.billing.city)) return res.status(400).send({ status: false, Message: "Please provide your city name in billing address" })

                if (!isValid(jsonAddress.billing.pincode)) return res.status(400).send({ status: false, Message: "Please provide your pin code in billing address" })

            }

        }

        /***************************Email, Phone & Password Validations******************/

        let emailregex = /^\w+@[a-zA-Z_]+?\.[a-zA-Z]{2,3}$/
        let phoneRegex = /^(\+91[\-\s]?)?[0]?(91)?[6789]\d{9}$/

        if (!email.trim().match(emailregex)) return res.status(400).send({ status: false, message: "Please enter valid email" })

        if (!phone.trim().match(phoneRegex)) return res.status(400).send({ status: false, message: "Please enter valid phone" })

        if (!isValidPassword(password)) return res.status(400).send({ status: false, message: "Please provide a vaild password ,Password should be of 8 - 15 characters" })

        /************************************Check duplicacy (Uniqueness)*****************/

        const isRegisterEmail = await userModel.findOne({ email: email })

        if (isRegisterEmail) return res.status(400).send({ status: false, message: "Email id already registered" })

        const isRegisterPhone = await userModel.findOne({ phone: phone })

        if (isRegisterPhone) return res.status(400).send({ status: false, message: "phone number is already registered" })

        /********************************************************************************/

        const profilePicture = await uploadFile(files[0])

        const encryptPassword = await bcrypt.hash(password, saltRounds)

        const userData = {
            fname: fname, lname: lname, profileImage: profilePicture, email: email,
            phone, password: encryptPassword, address: jsonAddress
        }


        const createUser = await userModel.create(userData)

        res.status(201).send({ status: true, message: `User registered successfully`, data: createUser });
    }
    catch (error) {
        res.status(500).send({ status: false, message: error.message })
    }
}

//to login user
const userLogin = async (req, res) => {
    let data = req.body
    const {email,password}  = data

     if(!isValid(email)) return res.status(400).send({status:false, message:'please enter your email address'})
    
    if (!email.trim().match(/^\w+@[a-zA-Z_]+?\.[a-zA-Z]{2,3}$/)) return res.status(400).send({ status: false, message: "Please enter valid email" })

    if(!isValid(password)) return res.status(400).send({status:false, message:'please enter your password'})

    const isEmailExists = await userModel.findOne({email:email})
    if(!isEmailExists) return res.status(400).send({status:false, message:'Email is wrong'})

    if (!isValidPassword(password)) return res.status(400).send({ status: false, message: "Please provide a vaild password ,Password should be of 8 - 15 characters" })

    const isPasswordMatch = await bcrypt.compare(password, isEmailExists.password)

    if(!isPasswordMatch) return res.status(400).send({status:false, message:'password is wrong'})
    

    const token = jwt.sign({
        userId : isEmailExists._id.toString(),
        expiresIn: '24h'

      }, 'shoppingCart');

      let result = {
        userId : isEmailExists._id.toString(),
        token: token
      }

    res.status(200).send({status:false, message:"Login Successful", data: result});
    
}

//to get user information
const getUser = async (req, res) => {
    try{
        userId = req.params.userId

        if(!isValidOjectId(userId)) return res.status(400).send({ status: false, message: " Invalid userId"})

        let data = await userModel.findById({_id: userId})
        if (!data){return res.status(404).send({status: false , message :"User profile not found"})}

        return res.status(200).send({status:true ,message:"User profile details",data:data})

    }
    catch(error){return res.status(500).send({status:false,message:error.message})}
    }

//to update user information
const updateUser = async (req, res) => {

}

module.exports = { userRegister, userLogin, getUser}

// module.exports = { userRegister, userLogin, getUser, updateUser }
