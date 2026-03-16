import { Router } from "express";
import {registerUser, loginUser , logoutUser} from "../controllers/user.controller.js"
import {upload} from "../middlewares/multer.middleware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";
const router = Router()

router.route("/register").post(
    upload.fields([
        {
            name : "avatar",
            maxCount : 1
        },
        {
            name : "coverImage",
            maxCount : 1
        } // we use multer middleware before register user to help store images and send them to controller . 
    ]),
    registerUser
)
//https://localhost:8000/users/register
//for login 
//router.route("/login").post(loginUser)
//https://localhost:8000/users/login
//we dont need to change anything on app.js

router.route("/login").post(
    loginUser
)

//secured routes
router.route("/login").post(
    verifyJWT , logoutUser
)
export default router;