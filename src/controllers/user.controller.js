import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";

const generateAccessandRefreshTokens = async(userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken= await user.generateAccessToken()
        const refreshToken = await user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({validateBeforeSave : false})

        return {accessToken, refreshToken}
    } catch (error) {
        throw new ApiError(505 , "Something went wrong while generating user and access token")
    }
}





const registerUser = asyncHandler( async (req,res) => {
    //get user details from frontend `
    //validation
    //check if user already exist  : username or email
    //check for images , check for avatar
    // upload thme to cloudinary , avatar
    // create user obj - create entry in db
    //remove pass word and refresh token field from response
    //return res

    const {fullName,email,username , password } = req.body
    //console.log("email: ",email)
    //console.log(req.body)

    if (
        [fullName,email,username,password].some((field)=> field?.trim() === "")
    ){
        throw new ApiError(400,"All fields are required")
    }

    const existingUser=  await User.findOne({
        $or: [{username} , {email}]
    })

    if(existingUser){
        throw new ApiError(409,"User already exists")
    }


    const avatarLocalPath = req.files?.avatar[0]?.path;
    //const coverLocalPath = req.files?.coverImage[0]?.path;

    let coverLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
        coverLocalPath = req.files.coverImage[0].path;
    }

    //console.log(req.files)
    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar file is required")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverLocalPath)

    if(!avatar){
        throw new ApiError(400, "Avatar file is required")
    }

    const user = await User.create({
        fullName,
        avatar : avatar.url,
        coverImage : coverImage?.url || "",
        email,
        password,
        username : username.toLowerCase()
    })


    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if(!createdUser){
        throw new ApiError(500,"Something went wrong while creating User")
    }

    return res.status(201).json(
        new ApiResponse(200,createdUser,"User registered successfully")
    )
})


const loginUser = asyncHandler( async (req,res) => {
 // req body -> data
 // username or password
 // find the user
 // check password
 // access and refresh token 
 // send them as cookie

 const {email , username , password, } = req.body

 if (!(username || email)){
    throw new ApiError(400 , "username or email is required")
 }

    const existingUser=  await User.findOne({
        $or: [{username} , {email}]
    })

    if(!existingUser)
    {
        throw new ApiError(404, "User not found")
    }

    const isPasswordValid = await existingUser.isPasswordCorrect(password)

    if(!isPasswordValid)
    {
        throw new ApiError(401 , "Password Incorrect")
    }

    const {accessToken, refreshToken} = await generateAccessandRefreshTokens(existingUser._id)

    const loggedInUser = await User.findById(existingUser._id).select("-password -refreshToken")

    //cookies
    const options = {
        httpOnly : true,
        secure : true
    }//cookie only modifiable by server

    return res.status(200)
    .cookie("acessToken",accessToken,options)
    .cookie("refreshToken",refreshToken,options)
    .json(
        new ApiResponse(201, {
            user : loggedInUser, accessToken , refreshToken
        },
        "User logged in successfully"
    )
    )


})

const logoutUser = asyncHandler( async (req,res) => {
     await User.findByIdAndUpdate(req.user._id, {
        $set : {
            refreshToken : undefined
        },
        
    },
    {
        new : true 
    }
)
    const options = {
            httpOnly : true,
            secure : true
        }
        
    return res.status(200).clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(
        new ApiResponse(200, {} , "User Logged Out")
    )
})
export {registerUser , loginUser , logoutUser}