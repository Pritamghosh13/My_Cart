import Router from "express"
import { verifyJWT } from "../middlewares/auth.middleware.js"
import { addToCart, removeFromCart } from "../controllers/cart.controller.js"

const router = Router()


router.route("/add").post(verifyJWT, addToCart)
router.route("/remove/:productId").patch(verifyJWT, removeFromCart)


export default router