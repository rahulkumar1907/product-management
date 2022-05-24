const express= require("express")
const router= express.Router()
const auth = require('../middleware/auth')
const {userRegister,userLogin,getUser,updateUser} = require("../controller/userController") 

router.post('/register',userRegister)

router.post('/login',userLogin)

router.get('/user/:userId/profile', auth, getUser)

router.put('/user/:userId/profile',auth, updateUser)


module.exports = router;