import { Router } from "express";
import { userRegister, userLoggedIn, userLogOut } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";


const router = Router()



router.route("/register").post( upload.single("avatar"),userRegister)

router.route("/logIn").post(userLoggedIn)

router.route("/logout").post( verifyJWT ,userLogOut)



export default router