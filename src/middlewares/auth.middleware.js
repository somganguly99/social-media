import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken"
import { User } from "../models/user.model.js";

export const verifyJWT = asyncHandler(async(req , _ , next)=> {

    try {
        // we use headers for mobile apps as they dont directly do cookies
    
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")
    
        if(!token){
            throw new ApiError(401,"Unauthorized Error")
        }
    
        const decodedToken = await jwt.verify(token,process.env.ACCESS_TOKEN_SECRET)
    
        const user = await User.findById(decodedToken?._id)
        .select("-password -refreshToken")
    
        if(!user)
        {
            throw new ApiError(401,"Invalid Access Token")
        }
    
        req.user = user;
        next()
    } catch (error) {
        throw new ApiError(401,error?.message || "Some Error Occured while logging out")
    }
})