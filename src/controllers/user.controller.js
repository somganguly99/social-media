import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary , deleteFromCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

const generateAccessandRefreshTokens = async(userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken= await user.generateAccessToken()
        const refreshToken = await user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({validateBeforeSave : false})

        return {accessToken, refreshToken}
    } catch (error) {
        console.log(error)
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
    //use secure true for https , doesnt work on localhost

    return res.status(200)
    .cookie("accessToken",accessToken,options)
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

const refreshAccessToken = asyncHandler(async (req,res) => {
   const incomingRefreshToken =  req.cookies.refreshToken || req.body.refreshToken

   if(!incomingRefreshToken){
    throw new ApiError(401,"Unauthorized Request")
   }

   try {
    const decodedToken = jwt.verify(
     incomingRefreshToken,
     process.env.REFRESH_TOKEN_SECRET
    )
 
    const user =await  User.findById(decodedToken?._id)
 
    if(!user){
     throw new ApiError(401,"Invalid Refresh Token")
    }
 
    if(incomingRefreshToken!== user?.refreshToken){
     throw new ApiError(401,"Refresh token is expired")
    }
 
    const options = {
     httpOnly : true,
     secure : true
    }
    const {accessToken,newRefreshToken} = await generateAccessandRefreshTokens(user._id)
 
    return res
    .status(200)
    .cookie("accessToken",accessToken, options)
    .cookie("refreshToken",newRefreshToken, options)
    .json(
     new ApiResponse(200,
     {accessToken,refreshToken : newRefreshToken},
     "Access token refreshed"
     ))
   } catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh token")
   }
})

const changeCurrentPassword = asyncHandler(async (req,res) => {
    const {oldPassword , newPassword} = req.body

    const user = await User.findById(req.user?._id) // since due to auth middleware we consider user is already logged in

    const isPasswordValid = await user.isPasswordCorrect(oldPassword)

    if(!isPasswordValid)
    {
        throw new ApiError(401 , "Password Incorrect")
    }

    user.password = newPassword
    await user.save({validateBeforeSave : false})//save to inflict changes , vfs ensures other fields in user schema arent checked

    return res
    .status(200)
    .json(new ApiResponse(200 , {}, "Password changed successfully"))
})

const getCurrentUser = asyncHandler(async (req,res)=> {
    return res
    .status(200)
    .json(new ApiResponse(200, req.user , "current User Details"))
})

const updateAccountDetails = asyncHandler(async (req,res) => {
    const{fullName ,email }= req.body

    if(!fullName|| !email){
        throw new ApiError(400, "All fields are required")
    }

    const user = await User.findByIdAndUpdate(req.user?._id,
        {
            $set : {
                fullName,
                email
            }
        },
        {new : true}
    ).select("-password -refreshToken")

    return res
    .status(200)
    .json(new ApiResponse(200, user , "Account Details Updated Successfully"))
})// create seperate fn for file update proffesional grade code

const updateUserAvatar = asyncHandler( async(req,res)=> {
    const avatarLocalPath = req.file?.path

    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar file is missing")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if(!avatar.url){
        throw new ApiError(400, "Error while uploading on avatar")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set :{
                avatar : avatar.url
            }
        },
        {new : true}
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(200, user , "Avatar update successfully")
    )
    //task delte avatar url
})

const updateUserCoverImage = asyncHandler( async(req,res)=> {
    const coverImageLocalPath = await req.file?.path

    if(!coverImageLocalPath){
        throw new ApiError(400, "coverImage file is missing")
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!coverImage.url){
        throw new ApiError(400, "Error while uploading coverImage")
    }
    
    const user = await User.findById(req.user?._id).select("-password")
    
    if (user.coverImage) {
    await deleteFromCloudinary(user.coverImage);
}

    console.log("previous image deleted successfully")
    /*const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set :{
                coverImage : coverImage.url
            }
        },
        {new : true}
    ).select("-password")*/
    user.coverImage = coverImage.url
    await user.save({validateBeforeSave : false})
    return res
    .status(200)
    .json(
        new ApiResponse(200, user , "Cover Image update successfully")
    )
})

const getUserChannelProfile = asyncHandler(async(req,res)=> {
    const {username} = req.params

    if(!username?.trim()){
        throw new ApiError(400,"username is missing")
    }

    const channel = await User.aggregate([
        {
            $match : {
                username : username?.toLowerCase()
            }
        },{
            $lookup : {
                from : "subscriptions",
                localField : "_id",
                foreignField : "channel",
                as : "subscribers"
            }
        }/**see subscribers by comparing user id with  number of pages containing that id as channel*/
        ,{
            $lookup : {
                from : "subscriptions", //model become lower case and plural
                localField : "_id",
                foreignField : "subscriber",
                as : "channels"
            }
        }/**see channels by comparing user id with  number of pages containing that id as subscriber*/
        ,{
            $addFIelds : {
                subscribersCount : {
                    $size : "$subscribers" //$size counts number of entries corresponding to given one in db . we use $ to show its a field
                },
                subscribedToCount : {
                    $size : "$channels"
                },
                isSubscribed : {
                    $cond : {
                        if: {$in : [req.user?._id, "$subscribers.subscriber"]}, //see if current user is present in subscribers db's subscriber field
                        then : true,
                        else : false //If subscribed tell frontend true , they will show subscribed as frontend , else show subscribe as button
                    }
                }
            }
        }, {
            $project : {
                fullName : 1,
                username : 1,
                subscribersCount : 1,
                subscribedToCount : 1,
                avatar : 1,
                coverImage : 1,
                isSubscribed :1,
                email : 1
            } //$project passes only the values projected as a result
        }
    ])//Aggregate pipeline is like join in MySQL

    if(!channel?.length){
        throw new ApiError(404,"Channel does not exist")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, channel [0], "User channel fetched successfully")
    ) 
})

const getWatchHistory = asyncHandler(async(req,res)=> {
     //the id we get from userId lookup is a string , so when we use findById mongoose internally does the processing 
     //mongoose doesnt work inside aggregate , we have to use directly
     const user = await User.aggregate([
        {
          $match:{
            _id : new mongoose.Types.ObjectId(req.user._id)
          }  
        }, {
            $lookup : {
                from :"videos",
                localField : "watchHistory",
                foreignField : "_id",
                as : "watchHistory",
                pipeline : [
                    {
                        $lookup : {
                            from : "users",
                            localField : "owner",
                            foreignField : "_id",
                            as : "owner",
                            pipeline : [
                                {
                                    $project : {
                                        fullName : 1,
                                        username : 1,
                                        avatar :1
                                    }
                                }
                            ]
                        }
                    }, {
                        $addFields : {
                            owner : {
                                $first : "$owner"
                            }
                        }
                    }
                ]
            }
        }
     ])

     return res.status(200)
     .json(
        new ApiRespinse(200, user[0].watchHistory,"Watch History fetched successfully")
     )
})



export {registerUser , loginUser , logoutUser , refreshAccessToken , changeCurrentPassword , getCurrentUser , updateAccountDetails, updateUserAvatar, updateUserCoverImage, getUserChannelProfile, getWatchHistory}