import { Router } from "express";
import { userRegister, userLoggedIn, userLogOut, changeUserPassword, getCurrentUser, updateProfile, updateAvatar} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";


const router = Router()



router.route("/register").post( upload.single("avatar"),userRegister)

router.route("/logIn").post(userLoggedIn)

router.route("/logout").post( verifyJWT ,userLogOut)

router.route("/password/change").patch(verifyJWT, changeUserPassword)

router.route("/profile").get(verifyJWT, getCurrentUser)

router.route("/profile/update").patch(verifyJWT, updateProfile)

router.route("/profile/avatar/update").patch(verifyJWT, upload.single("avatar"), updateAvatar)



export default router