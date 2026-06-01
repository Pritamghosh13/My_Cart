import { Cart } from "../models/cart.model.js";
import { Product } from "../models/products.model.js";
import { asyncHandler } from "../utils/Asynchandller.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";




//add items to cart
const addToCart = asyncHandler(async (req, res) => {
    const { productId, quantity } = req.body

    if (!productId) {
        throw new ApiError(400, "Product Id is required")
    }

    if (!quantity || quantity < 1) {
        throw new ApiError(400, "Quantity must be at least 1");
    }

    const product = await Product.findById(productId)


    if (!product) {
        throw new ApiError(400, "Product not available")
    }

    const userCart = await Cart.findOne({
        user: req.user?._id
    })

    //if cart doesn't exist, create one 
    if (!userCart) {
        const createdCart = await Cart.create({
            user: req.user?._id,
            items: [
                {
                    product: productId,
                    quantity
                }
            ]
        })

        return res.status(200)
        .json(new ApiResponse(200, createdCart, "Product added to cart successfully"))
    }


    //if cart exist.

    const itemIndex = userCart.items.findIndex(
        item => item.product.toString() === productId
    )

    if(itemIndex > -1){
        userCart.items[itemIndex].quantity += quantity;
    }
    else{
        userCart.items.push({
            product: productId,
            quantity
        })
    }

    await userCart.save()

    const updatedCart = await Cart.findById(userCart._id).populate("items.product")

    return res.status(200).json(
        new ApiResponse(
            200,
            updatedCart,
            "Product added to cart successfully"
        )
    )

})



//remove from cart
const removeFromCart = asyncHandler(async (req, res) => {

    const { productId } = req.params;

    const cart = await Cart.findOne({
        user: req.user?._id
    })

    if (!cart) {
        throw new ApiError(404, "Cart not found")
    }

    const itemIndex = cart.items.findIndex(
        item => item.product.toString() === productId
    )

    if (itemIndex === -1) {
        throw new ApiError(404, "Product not found")
    }

    cart.items.splice(itemIndex, 1);

    await cart.save()

    await cart.populate("items.product");

    return res.status(200)
    .json(new ApiResponse(200, cart, "Product remove from cart"))

})




//update cart quantity
const updateCartQuantity = asyncHandler(async (req, res) => {
    const {productId, quantity} = req.body;

    if (!productId) {
        throw new ApiError(400, "Product Id is required")
    }

    if (!quantity || quantity<1) {
        throw new ApiError(400, "Quantity is required")
    }

    const cart = await Cart.findOne({
        user: req.user?._id
    })

    if (!cart) {
        throw new ApiError(404, "Cart not found")
    }

    const itemIndex = cart.items.findIndex(
        item => item.product.toString() === productId
    )

    if (itemIndex === -1) {
        throw new ApiError(404, "Product not found in cart");
    }

    cart.items[itemIndex].quantity = quantity;

    await cart.save()

    await cart.populate("items.product")

    return res.status(200).json(
    new ApiResponse(
        200,
        cart,
        "Cart quantity updated successfully"
    )
    );




})




//get user cart
const getUserCart = asyncHandler(async (req, res) => {
    const cart = await Cart.findOne({
        user: req.user?._id
    }).populate("items.product")

    if (!cart) {
        throw new ApiError(404, "User cart not found")
    }


    return res.status(200)
    .json(new ApiResponse(200, cart, "User cart fetched successfully"))
})




//clear cart
const clearCart = asyncHandler(async (req, res) => {

    const cart = await Cart.findOne({
        user: req.user?._id
    });

    if (!cart) {
        throw new ApiError(404, "Cart not found");
    }

    cart.items = [];

    await cart.save();

    return res.status(200).json(
        new ApiResponse(
            200,
            cart,
            "Cart cleared successfully"
        )
    );
});









export {
    addToCart,
    removeFromCart,
    updateCartQuantity,
    getUserCart,
    clearCart
}