import Router from "express"
import { verifyJWT } from "../middlewares/auth.middleware.js"
import { addToCart, getUserCart, removeFromCart, updateCartQuantity } from "../controllers/cart.controller.js"

const router = Router()


router.route("/add").post(verifyJWT, addToCart)
router.route("/remove/:productId").patch(verifyJWT, removeFromCart)
router.route("/update").patch(verifyJWT, updateCartQuantity)
router.route("/get-cart").get(verifyJWT, getUserCart)


export default router