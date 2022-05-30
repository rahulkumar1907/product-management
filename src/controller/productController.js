const productModel = require("../model/productModel")
const uploadFile = require("./awsController")
const mongoose = require("mongoose")
const {isValid,isValidObjectId,isValidFiles} = require("../validation/validate")



/***************************Global validation End**************************/

/**************************Fifth Api****************************/

const createProduct = async (req, res) => {
  try {
    const data = req.body
    if (!Object.keys(data).length)
      return res.status(400).send({
        status: false,
        message: "please provide product details to create.",
      })

    const {
      title,
      description,
      price,
      currencyId,
      currencyFormat,
      isFreeShipping,
      style,
      availableSizes,
    } = data
    const files = req.files

    if (!isValidFiles(files))
      return res
        .status(400)
        .send({ status: false, message: "Please provide product's image" })

    if (!isValid(title))
      return res
        .status(400)
        .send({ status: false, message: "Please provide product's title" })

    if (!isValid(description))
      return res.status(400).send({
        status: false,
        message: "Please provide product's description",
      })

    if (!isValid(price))
      return res
        .status(400)
        .send({ status: false, message: "Please provide product's price" })
    if (!price.match(/^\d*\.?\d*$/))
      return res
        .status(400)
        .send({ status: false, message: "Price must be an integer" })

    if (!isValid(currencyId))
      return res
        .status(400)
        .send({ status: false, message: "Please provide currencyId" })

    if (currencyId != "INR")
      return res
        .status(400)
        .send({ status: false, message: "currency should be INR" })

    if (!isValid(currencyFormat))
      return res
        .status(400)
        .send({ status: false, message: "Please provide currency Format" })
    if (currencyFormat != "₹")
      return res
        .status(400)
        .send({ status: false, message: "currency format should be ₹ " })

    if (!availableSizes)
      return res.status(400).send({
        status: false,
        message: "Atleast one product size should be give",
      })

    if (availableSizes) {
      var availableSize = availableSizes.toUpperCase().split(",") // Creating an array
      if (availableSize.length === 0) {
        return res
          .status(400)
          .send({ status: false, message: "please provide the product sizes" })
      }

      for (let i = 0; i < availableSize.length; i++) {
        if (
          !["S", "XS", "M", "X", "L", "XXL", "XL"].includes(availableSize[i])
        ) {
          return res.status(400).send({
            status: false,
            message: `Sizes should be ${[
              "S",
              "XS",
              "M",
              "X",
              "L",
              "XXL",
              "XL",
            ]} value (with multiple value please give saperated by comma)`,
          })
        }
      }
    }

    if (data.installments) {
      if (!data.installments.match(/^\d*\.?\d*$/))
        return res
          .status(400)
          .send({ status: false, message: "Installment must be an integer" })
    }

    /************************Duplicacy validation****************************************/

    const isTitleExist = await productModel.findOne({ title: title })
    if (isTitleExist)
      return res
        .status(400)
        .send({ status: false, message: "title is already registered" })

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
      availableSizes: availableSize,
    }

    const createProduct = await productModel.create(productData)

    res.status(201).send({
      status: true,
      message: "product created sucessfully",
      data: createProduct,
    })
  } catch (error) {
    res.status(500).send({ status: false, message: error.message })
  }
}

/**************************Sixth Api*************************/
const getProduct = async (req, res) => {
  try {
    let data = req.query
    if (
      !data.name &&
      !data.size &&
      !data.priceGreaterThan &&
      !data.priceLessThan &&
      !Object.keys(data).length
    ) {
      return res.status(400).send({
        status: false,
        message:
          "Please provide atleast one search parameter from name,size,priceGreaterThan,priceLessThan",
      })
    }

    let filter = { isDeleted: false }

    if (data.name || data.name === "") {
      if (!isValid(data.name))
        return res.status(400).send({
          status: false,
          message: "Enter a valid value for product name ",
        })

      //using $regex to match the names of products & "i" for case insensitive.
      filter.title = {}
      filter.title["$regex"] = data.name
      filter.title["$options"] = "i"
    }

    if (data.size || data.size === "") {
      if (!isValid(data.size))
        return res.status(400).send({
          status: false,
          message: "Enter a valid value for product size ",
        })
      filter.availableSizes = {}
      filter.availableSizes["$in"] = data.size.toUpperCase().split(",")
    }

    if (data.priceGreaterThan === "" || data.priceLessThan === "")
      return res
        .status(400)
        .send({ status: false, message: "Price cant be empty" })

    if (data.priceGreaterThan || data.priceLessThan) {
      if (data.priceGreaterThan) {
        if (!isValid(data.priceGreaterThan))
          return res.status(400).send({
            status: false,
            message: "Enter a valid value for product price ",
          })
        let numGte = Number(data.priceGreaterThan)
        if (!/^\d*\.?\d*$/.test(numGte))
          return res.status(400).send({
            status: false,
            message:
              "Enter a valid value and must be number for price greater than ",
          })
      }

      if (data.priceLessThan) {
        let numLte = Number(data.priceLessThan)
        if (!/^\d*\.?\d*$/.test(numLte))
          return res.status(400).send({
            status: false,
            message:
              "Enter a valid value and must be number  for price less than ",
          })
      }

      filter.price = {}
      if (data.priceGreaterThan && data.priceLessThan) {
        filter.price["$gte"] = data.priceGreaterThan
        filter.price["$lte"] = data.priceLessThan
      } else {
        if (data.priceGreaterThan) filter.price["$gte"] = data.priceGreaterThan
        if (data.priceLessThan) filter.price["$lte"] = data.priceLessThan
      }
    }

    const getProduct = await productModel.find(filter).sort({ title: 1 })

    if (!getProduct.length) {
      return res
        .status(404)
        .send({ status: false, message: "Product not found" })
    }

    return res
      .status(200)
      .send({ status: true, message: "Product details", data: getProduct })
  } catch (error) {
    //console.log(error)
    res.status(500).send({ status: false, message: error.message })
  }
}

/**************************Seventh Api*************************/
const getProductById = async (req, res) => {
  try {
    let productId = req.params.productId

    if (!isValidObjectId(productId))
      return res
        .status(400)
        .send({ status: false, message: " Invalid productId" })

    let data = await productModel.findOne({ _id: productId, isDeleted: false })
    if (!data) {
      return res
        .status(404)
        .send({ status: false, message: "Product not found" })
    }

    return res
      .status(200)
      .send({ status: true, message: "Product details", data: data })
  } catch (error) {
    return res.status(500).send({ status: false, message: error.message })
  }
}

/**************************Eighth Api*************************/
const updateProduct = async (req, res) => {
  try {
    let productId = req.params.productId
    let data = req.body

    let files = req.files

    if (!isValidObjectId(productId))
      return res
        .status(400)
        .send({ status: false, message: " Invalid productId" })

    //Check product in DB
    let checkedProductId = await productModel.findOne({ _id: productId })
    if (!checkedProductId)
      return res
        .status(404)
        .send({ status: false, message: "Product not Exist" })

    if (!(files && !Object.keys(data).length)) {
      if (!Object.keys(data).length)
        return res
          .status(400)
          .send({ status: false, message: "It seems like Nothing to update" })
    }

    //check if title is present or Not
    if (data.title || data.title === "") {
      if (!isValid(data.title))
        return res
          .status(400)
          .send({ status: false, message: "Please provide title" })
    }

    // check title in DB
    const isTitleExist = await productModel.findOne({ title: data.title })
    if (isTitleExist)
      return res
        .status(400)
        .send({ status: false, message: "title is already registered" })

    //check if description is present or Not
    if (data.description || data.description === "") {
      if (!isValid(data.description))
        return res
          .status(400)
          .send({ status: false, message: "Please provide description" })
    }

    //check if price is present or not
    if (data.price || data.price === "") {
      if (!isValid(data.price))
        return res
          .status(400)
          .send({ status: false, message: "Please provide price" })
      if (!data.price.match(/^\d*\.?\d*$/))
        return res
          .status(400)
          .send({ status: false, message: "Price must be an integer" })
    }
    //check if currencyId is present or not
    if (data.currencyId || data.currencyId === "") {
      if (!isValid(data?.currencyId))
        return res
          .status(400)
          .send({ status: false, message: "Please provide currencyId" })
      if (data.currencyId != "INR")
        return res
          .status(400)
          .send({ status: false, message: "currency should be INR" })
    }

    //check if productImage is present or not
    if (files) {
      if (files.length === 0)
        return res
          .status(400)
          .send({ status: false, message: "Please upload productImage" })
      const productPicture = await uploadFile(files[0])
      data.productImage = productPicture
    }

    //check if currencyFormat is present or not
    if (data.currencyFormat || data.currencyFormat === "") {
      if (!isValid(data.currencyFormat))
        return res
          .status(400)
          .send({ status: false, message: "Please provide currencyFormat" })
      if (data.currencyFormat != "₹")
        return res
          .status(400)
          .send({ status: false, message: "currency format should be ₹ " })
    }

    //check if isFreeShipping is present or not
    if (data.isFreeShipping || data.isFreeShipping === "") {
      // if (!isValid(data.isFreeShipping)) return res.status(400).send({ status: false, message: "isFreeShipping cant be empty" })
      if (
        !data.isFreeShipping
          .toLowerCase()
          .match(/^(true|false|True|False|TRUE|FALSE)$/)
      )
        return res.status(400).send({
          status: false,
          message: "Please provide isFreeShipping true/false",
        })
    }

    //check if style is present or not
    if (data.style || data.style === "") {
      if (!isValid(data.style))
        return res
          .status(400)
          .send({ status: false, message: "Please provide style" })
    }

    //check if availableSizes is present or not
    if (data.availableSizes || data.availableSizes === "") {
      var availableSize = data.availableSizes.toUpperCase().split(",") // Creating an array
      for (let i = 0; i < availableSize.length; i++) {
        if (
          !["S", "XS", "M", "X", "L", "XXL", "XL"].includes(availableSize[i])
        ) {
          return res.status(400).send({
            status: false,
            message: `Sizes should be ${[
              "S",
              "XS",
              "M",
              "X",
              "L",
              "XXL",
              "XL",
            ]} value (with multiple value please give saperated by comma)`,
          })
        }
      }
    }

    //check if installments is present or not
    if (data.installments || data.installments === "") {
      if (!isValid(data.installments))
        return res
          .status(400)
          .send({ status: false, message: "Please provide installments" })
      if (!data.installments.match(/^\d*\.?\d*$/))
        return res
          .status(400)
          .send({ status: false, message: "Installment must be an integer" })
    }

    const updateData = await productModel.findOneAndUpdate(
      { _id: productId, isDeleted: false },
      {
        title: data.title,
        description: data.description,
        price: data.price,
        currencyId: data.currencyId,
        currencyFormat: data.currencyFormat,
        productImage: data.productImage,
        style: data.style,
        availableSizes: availableSize,
        installments: data.installmentseUpdate,
        isFreeShipping: data.isFreeShipping,
      },
      { new: true }
    )

    return res.status(200).send({
      status: true,
      message: "product updated successfully",
      data: updateData,
    })
  } catch (error) {
    return res.status(500).send({ status: false, message: error.message })
  }
}

/**************************Ninth Api*************************/
const deleteProduct = async (req, res) => {
  try {
    //reading productId from path
    const productId = req.params.productId

    //id format validation
    if (!isValidObjectId(productId))
      return res
        .status(400)
        .send({ status: false, message: " Invalid productId" })

    //fetch product
    const products = await productModel.findOneAndUpdate(
      { _id: productId, isDeleted: false },
      { isDeleted: true, deletedAt: Date.now() },
      { new: true }
    )
    if (!products)
      return res
        .status(404)
        .send({ status: false, message: "products not found" })

    return res.status(200).send({
      status: true,
      message: "Product has been deleted successfully",
      data: products,
    })
  } catch (error) {
    res.status(500).send({ status: false, message: error.message })
  }
}

module.exports = {
  createProduct,
  getProduct,
  getProductById,
  deleteProduct,
  updateProduct,
}
