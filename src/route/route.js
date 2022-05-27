const express= require("express")
const router= express.Router()
const auth = require('../middleware/auth')
const {userRegister,userLogin,getUser,updateUser} = require("../controller/userController") 
const {createProduct,getProduct,getProductById,updateProduct, deleteProduct} = require('../controller/productController')
const {createCart} = require('../controller/cartController')

/*********************For User**************************************************************/
router.post('/register', userRegister)

router.post('/login',userLogin)

router.get('/user/:userId/profile', auth, getUser)

router.put('/user/:userId/profile',auth, updateUser)

/************************For products******************************************************/

router.post('/products', createProduct);

router.get('/products', getProduct);

router.get('/products/:productId', getProductById);

router.put('/products/:productId', updateProduct);

router.delete('/products/:productId', deleteProduct);

/************************For carts******************************************************/

router.post('/users/:userId/cart', createCart);


module.exports = router;