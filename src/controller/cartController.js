const cartModel = require('../model/cartModel');
const userModel = require('../model/userModel')
const productModel = require('../model/productModel')
const mongoose = require('mongoose')




/**********************Global validation*****************************/
//to check validation 
const isValid = (value) => {
    if (typeof value === 'undefined' || typeof value === 'null') return false
    if (typeof value === 'string' && value.trim().length === 0) return false
    return true;
}

//to check validation of objectId
const isValidObjectId = (objectId) => {
    return mongoose.isValidObjectId(objectId)
}


/*******tenth Api********/
const createCart = async (req, res) => {

    try {
        let data = req.body
        let userId = req.params.userId
        let item = data.items

        // access of productId and quantity from request body items key 
        for (let i = 0; i < item.length; i++) {
            var findProductId = item[i].productId
            var findQuantity = item[i].quantity
        }

        // valid user or not
        if (!isValidObjectId(userId)) return res.status(400).send({ status: false, message: " Invalid userId" })

        //  authorised user or not
        // if (userId !== req.userId) return res.status(400).send({ status: false, message: "Unauthorized access" })

        // valid request body
        if (!Object.keys(data).length) return res.status(400).send({ status: false, message: "Invalid request. please provide details." })
        // validation for items key
        if (!item) return res.status(400).send({ status: false, message: "Invalid request. please provide items" })
        // validation for product id present in items
        if (!findProductId) return res.status(400).send({ status: false, message: "Invalid request. please provide productId in items " })
        // validation for quantity present in items
        if (!findQuantity) return res.status(400).send({ status: false, message: "Invalid request. please provide quantity in items " })

        // finding product by productId whose isDeleted false
        const checkProduct = await productModel.find({ _id: findProductId, isDeleted: false }).populate()
        // checking product exist or not   
        if (!checkProduct) return res.status(404).send({ status: false, message: "Product is not found or Already deleted" })

        // checking cart exist or not if not exist then creating the cart
        let checkExistingCart = await cartModel.findOne({ userId: userId })

        // finding product price from cart
        if (!checkExistingCart) {
            for (let i = 0; i < checkProduct.length; i++) {
                var productPrice = checkProduct[i].price
            }

            //  create object 
            let newCart = {
                userId: userId,
                items: [{ productId: findProductId, quantity: findQuantity }],
                totalPrice: productPrice,
                totalItems: 1
            }

            let createCart = await cartModel.create(newCart)
            return res.status(201).send({ status: true, message: "Cart created successfully", data: createCart })
        }


        // for updating product price when cart exist
        for (i = 0; i < checkProduct.length; i++) {
            var price = checkProduct[i].price
        }

        // pushing items into items key
        let itemArray = checkExistingCart.items
        // console.log(itemArray)
        for (let i = 0; i < itemArray.length; i++) {

            if (itemArray[i]) {
                let itemPush = itemArray.concat(item)
                // console.log("hi4")

                //  updating the according to require using mental code logic to update totalprice ,push item and to length of total items
                let cartUpdate = await cartModel.findOneAndUpdate({ userId: userId }, { items: itemPush, totalPrice: checkExistingCart.totalPrice + price, totalItems: itemPush.length }, { new: true })
                return res.status(200).send({ status: true, data: cartUpdate })

            }
        }
    } catch (error) {
        res.status(500).send({ status: false, message: error.message })
    }
}



/**********************Eleventh Api***********************/
const updateCart = async (req, res) => {
    try {
      const { userId } = req.params
      const data = req.body
      const { cartId, productId, removeProduct } = data
  
      // * 📌VALIDATION
  
      //is ObjectId valid?
      if (!isValidObjectId(userId))
        return res.status(400).send({ status: false, message: 'invalid User Id' })
  
      //Authorization of user
     // if(req.userId !== userId) return res.status(403).send({status:false,message:"You are not authorized to update your cart"})
     
     // if empty body
      if (!Object.keys(data).length) {
        return res.status(400).send({
          status: false,
          message: 'Please provide cartId and productId and removeProduct detail',
        })
      }
  
      //if cartId is validation
      if (!isValid(cartId))
        return res
          .status(400)
          .send({ status: false, message: 'Please provide cartId' })
      if (!isValidObjectId(cartId))
        return res.status(400).send({ status: false, message: 'invalid cart Id' })
  
      //productId is valid or not
      if (!isValid(productId))
        return res
          .status(400)
          .send({ status: false, message: 'Please provide productId' })
      if (!isValidObjectId(productId))
        return res
          .status(400)
          .send({ status: false, message: 'invalid product Id' })
      if (!isValid(removeProduct))
        return res.status(400).send({
          status: false,
          message: 'Please provide removeProduct',
        })
  
      //to accept only 0-1 number
      if (!/[0-1]/.test(removeProduct))
        return res.status(400).send({
          status: false,
          message: 'removeProduct must be NUMBER and only 0,1 accepted',
        })
  
      // * END OF VALIDATION
  
  
      //*📌LOGIC
      let isProductExits = await productModel.findOne({
        _id: productId,
        isDeleted: false,
      })
      if (!isProductExits)
        return res
          .status(404)
          .send({ status: false, message: 'product is not available ' })
  
      const isCart = await cartModel.findOne({
        cartId: cartId,
        'items.productId': productId,
      })
  
      if (!isCart)
        return res.status(404).send({
          status: false,
          message: 'Please create cart to update product',
        })
      console.log(isCart)
  
      //to reduce quantity of product
      if (removeProduct == 1) {
        let productPrice = isProductExits.price
        //to decrease quantity of product by one
        let updateCart = await cartModel.findOneAndUpdate(
          { cartId: cartId, 'items.productId': productId },
          { $inc: { 'items.$.quantity': -1 , totalPrice :-productPrice} },
          { new: true }
        )
        //to check if product quantity is 0 or note
        let qty = updateCart.items.filter(
          (item) => item.productId.toString() === productId
        )[0].quantity
  
        if (qty == 0) {
          let productPrice = isProductExits.price
          let result = await cartModel.findOneAndUpdate(
            { cartId: cartId, 'items.productId': productId },
            {
              $inc: { totalPrice: -productPrice, totalItems: -1 },
              $pull: { items: { productId: productId } },
            },
            { new: true }
          )
          return res.status(200).send({
            status: true,
            message: 'product removed from cart',
            data: result
          })
        }
  
        return res.status(200).send({
          status: true,
          message: 'one quantity has been removed successfully',
          data: updateCart,
        })
      }
  
      // * to delete product from cart
      if (removeProduct == 0) {
        let productPrice = isProductExits.price
        let result = await cartModel.findOneAndUpdate(
          { cartId: cartId, 'items.productId': productId },
          {
            $inc: { totalPrice: -productPrice, totalItems: -1 },
            $pull: { items: { productId: productId } },
          },
          { new: true }
        )
        return res.status(200).send({
          status: true,
          message: 'product removed from cart',
          data: result,
        })
      }
    } catch (error) {
      console.log(error)
      res.status(500).send({ status: false, message: error.message })
    }
  }

/**********************Twelveth Api***********************/
const getCart = async (req, res) => {
    try {
        const userId = req.params.userId

        /****************************Validation of UserId***********************/
        if (!isValidOjectId(userId)) return res.status(400).send({ status: false, message: "Please provide a valis userId" })


        //Authorisation Field
        if (req.userId !== jwtUserId) return res.status(400).send({ status: false, message: "Unauthorised access" })

        //Checking cart in DB
        const checkingCart = await cartModel.findOne({ userId: userId })
        if (!checkingCart) return res.status(400).send({ status: false, message: "Cart is not available" })

        //Checking User in DB.
        const checkingUser = await userModel.findById(userId)
        if (!checkingUser) return res.status(400).send({ status: false, message: "User doesn't exists" })

        res.status(200).send({ status: true, message: "Cart getting successfully", data: checkingCart })

    } catch (error) {
        res.status(500).send({ status: false, message: error.message })
    }

}

/**********************Thirteenth Api***********************/
const deleteCart = async (req, res) => {
    try {
        const userId = req.params.userId

        /****************************Validation of UserId***********************/
        if (!isValidOjectId(userId)) return res.status(400).send({ status: false, message: "Please provide a valis userId" })

        //Authorisation Field
        if (req.userId !== userId) return res.status(400).send({ status: false, message: "Unauthorised access" })

        //Checking cart in DB
        const checkingCart = await cartModel.findOne({ userId: userId })
        if (!checkingCart) return res.status(400).send({ status: false, message: "Cart is not available" })

        //Checking User in DB.
        const checkingUser = await userModel.findById(userId)
        if (!checkingUser) return res.status(400).send({ status: false, message: "User doesn't exists" })

        const deletedCart = await cartModel.findOneAndUpdate({ userId: userId }, { item: [], totalItems: 0, totalPrice: 0 })
        res.status(200).send({ status: true, message: "Cart has been deleted successfully", data: deletedCart })


    } catch (error) {
        res.status(500).send({ status: false, message: error.message })
    }

}



module.exports = { createCart, updateCart, getCart, deleteCart }