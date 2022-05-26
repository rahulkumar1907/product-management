const productModel = require('../model/productModel');
const uploadFile = require('./awsController');
const mongoose = require('mongoose')

const bcrypt = require('bcrypt');

/**********************Global validation*****************************/
//to check validation 
const isValid = (value) => {
    if (typeof value === 'undefined' || typeof value === 'null') return false
    if (typeof value === 'string' && value.trim().length === 0) return false
    return true;
}

//to check validation of objectId
const isValidOjectId = (objectId) => {
    return mongoose.isValidObjectId(objectId)
}


const isValidFiles = (files) => {
    if (files && files.length > 0)
        return true
}



/**************************Fifth Api*************************/

const createProduct = async (req, res) => {
    try {

        const data = req.body;
        if (!Object.keys(data).length) return res.status(400).send({ status: false, message: "please provide product details to create." })

        const { title, description, price, currencyId, currencyFormat, isFreeShipping, style, availableSizes } = data
        const files = req.files

        if (!isValidFiles(files)) return res.status(400).send({ status: false, message: "Please provide product's image" })

        if (!isValid(title)) return res.status(400).send({ status: false, message: "Please provide product's title" })

        if (!isValid(description)) return res.status(400).send({ status: false, message: "Please provide product's description" })

        if (!isValid(price)) return res.status(400).send({ status: false, message: "Please provide product's price" })
        if (!price.match(/^\d*\.?\d*$/)) return res.status(400).send({ status: false, message: "Price must be an integer" })

        if (!isValid(currencyId)) return res.status(400).send({ status: false, Message: "Please provide currencyId" })

        if (currencyId != 'INR') return res.status(400).send({ status: false, Message: "currency should be INR" })

        if (!isValid(currencyFormat)) return res.status(400).send({ status: false, Message: "Please provide currency Format" })
        if (currencyFormat != "₹") return res.status(400).send({ status: false, Message: "currency format should be ₹ " })

        if (availableSizes) {
            var availableSize = availableSizes.toUpperCase().split(",")  // Creating an array
            if (availableSize.length === 0) {
                return res.status(400).send({ status: false, message: "please provide the product sizes" })
            }

            for (let i = 0; i < availableSize.length; i++) {
                if (!(["S", "XS", "M", "X", "L", "XXL", "XL"]).includes(availableSize[i])) {
                    return res.status(400).send({ status: false, message: `Sizes should be ${["S", "XS", "M", "X", "L", "XXL", "XL"]} value (with multiple value please give saperated by comma)` })
                }
            }
        }

        if (data.installments) {
            if (!data.installments.match(/^\d*\.?\d*$/)) return res.status(400).send({ status: false, message: "Installment must be an integer" })
        }

        /************************Duplicacy validation****************************************/

        const isTitleExist = await productModel.findOne({ title: title })
        if (isTitleExist) return res.status(400).send({ status: false, message: 'title is already exists' })

        /********************************Validation ends**********************************/

        const productPhoto = await uploadFile(files[0])

        const productData = {
            title: title,
            description: description,
            price: price,
            currencyId: currencyId,
            currencyFormat: currencyFormat,
            isFreeShipping: isFreeShipping,
            style: style,
            productImage: productPhoto,
            availableSizes: availableSize
        }

        const createProduct = await productModel.create(productData)

        res.status(201).send({ status: true, message: "product created sucessfully", data: createProduct });

    } catch (error) {
        console.log(error)
        res.status(500).send({ status: false, message: error.message })
    }
}


const getProductById = async (req, res) => {
    try {
        let productId = req.params.productId

        if (!isValidOjectId(productId)) return res.status(400).send({ status: false, message: " Invalid productId" })

        let data = await productModel.findOne({ _id: productId, isDeleted: false })
        if (!data) { return res.status(404).send({ status: false, message: "Product not found" }) }

        return res.status(200).send({ status: true, message: "Product details", data: data })

    }
    catch (error) { return res.status(500).send({ status: false, message: error.message }) }
}

const deleteProduct = async (req, res) => {
    try {
        //reading productId from path
        const productId = req.params.productId;

        //id format validation
        if (!isValidOjectId(productId)) return res.status(400).send({ status: false, message: " Invalid productId" })

        //fetch product
        const products = await productModel.findOneAndUpdate({ _id: productId, isDeleted: false }, { isDeleted: true, deletedAt: Date.now() }, { new: true });
        if (!products) return res.status(404).send({ status: false, message: "products not found" });

        return res.status(200).send({ status: true, data: products });
    }
    catch (error) { res.status(500).send({ status: false, message: error.message, }) }
};


const updateproduct = async (req, res) => {

    try {
        let productId = req.params.productId
        let data = req.body
        console.log(data);
        let files = req.files

        if (!isValidOjectId(productId)) return res.status(400).send({ status: false, message: " Invalid productId" })

        if (!Object.keys(data).length) return res.status(400).send({ status: false, message: "please provide product details to update." })

        if (!files) {
            if (!isValidFiles(files)) return res.status(400).send({ status: false, Message: "Please provide productImage" })
        }
        //check if title is present or Not
        if (data?.title === '') {
            return res.status(403).send({ status: false, Message: "please enter  title" })
        }

        if (data?.title) {

            if (!isValid(data.title)) return res.status(400).send({ status: false, Message: "Please provide title" })
        }

        //check if description is present or Not
        if (data?.description === '') {
            return res.status(403).send({ status: false, Message: "please enter  description" })
        }
        if (data?.description) {
            if (!isValid(data.description)) return res.status(400).send({ status: false, Message: "Please provide description" })

        }

        //check if price is present or not
        if (data?.price === '') {
            return res.status(403).send({ status: false, Message: "please enter  price" })
        }

        if (data?.price) {
            if (!isValid(data?.price)) return res.status(400).send({ status: false, Message: "Please provide price" })
        }
        //check if currencyId is present or not
        if (data?.currencyId === '') {
            return res.status(403).send({ status: false, Message: "please enter  currencyId" })
        }
        if (data?.currencyId) {
            if (!isValid(data?.currencyId)) return res.status(400).send({ status: false, Message: "Please provide currencyId" })
        }
        //check if productImage is present or not
        if (isValidFiles(files)) {
            if (files.length === 0) return res.status(400).send({ status: false, Message: "Please upload productImage" })
            const productPicture = await uploadFile(files[0])
            data.productImage = productPicture
            console.log(data.productImage);
        }
        //check if currencyFormat is present or not
        if (data?.currencyFormat === '') {
            return res.status(403).send({ status: false, Message: "please enter  currencyFormat" })
        }

        if (data?.currencyFormat) {
            if (!isValid(data.currencyFormat)) return res.status(400).send({ status: false, Message: "Please provide currencyFormat" })
        }

        //check if isFreeShipping is present or not
        if (data?.isFreeShipping === '') {
            return res.status(403).send({ status: false, Message: "please enter  isFreeShipping true/false" })
        }

        if (data?.isFreeShipping) {
            if (!isValid(data.isFreeShipping)) return res.status(400).send({ status: false, Message: "Please provide isFreeShipping true/false" })
        }
        //check if style is present or not
        if (data?.style === '') {
            return res.status(403).send({ status: false, Message: "please enter  style" })
        }

        if (data?.style) {
            if (!isValid(data.style)) return res.status(400).send({ status: false, Message: "Please provide style" })
        }
        //check if availableSizes is present or not
        if (data?.availableSizes === '') {
            return res.status(403).send({ status: false, Message: "please enter  availableSizes from S, XS,M,X, L,XXL, XL" })
        }

        if (data?.availableSizes) {
            if (!isValid(data.availableSizes)) return res.status(400).send({ status: false, Message: "Please provide availableSizes from S, XS,M,X, L,XXL, XL" })
        }
        //check if installments is present or not
        if (data?.installments === '') {
            return res.status(403).send({ status: false, Message: "please enter  installments" })
        }

        if (data?.installments) {
            if (!isValid(data.installments)) return res.status(400).send({ status: false, Message: "Please provide installments" })
        }
        let oldProductData = await productModel.findById({ _id: productId, isDeleted: false })
        let dataTobeUpdate = {
            title: data.title, description: data.description, price: data.price, currencyId: data.currencyId, currencyFormat: data.currencyFormat, productImage: data.profileImage,
            style: data.style, availableSizes: data.availableSizes, installments: data.installments
        }
        // date insertion
        const date = new Date().toISOString();
        const updateData = await productModel.findOneAndUpdate({ _id: productId }, { $set: { dataTobeUpdate, deletedAt: date } }, { new: true })
        return res.status(200).send({ status: true, message: "product updated successfully", data: updateData })


    } catch (error) {
        return res.status(500).send({ status: false, message: error.message })
    }

}

module.exports = { createProduct, getProductById, deleteProduct, updateproduct }