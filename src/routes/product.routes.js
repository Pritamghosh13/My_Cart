import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { adminOrNot } from "../middlewares/admin.controller.js";
import { addproduct, updateProductDetails } from "../controllers/product.controller.js";
import { upload } from "../middlewares/multer.middleware.js";




const router = Router()


router.route("/add").post(verifyJWT, adminOrNot, upload.array("images", 5), addproduct)

router.route("/update/:productId").patch(verifyJWT, adminOrNot, upload.array("images", 5), updateProductDetails)





export default router
