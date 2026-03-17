import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet
    const {content }= req.body
    if (
                content.trim() === ""
            ){
                throw new ApiError(400,"All fields are required")
            }

        const owner = await User.findById(req.user?._id).select("-password")
        if(!owner)
            {
                throw new ApiError(402, "Invalid Authorization")
            }
        const tweet = await Tweet.create ({
            content,
            owner : owner._id
        })

        const createdTweet = await Tweet.findById(tweet._id)
            
             if(!createdTweet){
                    throw new ApiError(500,"Something went wrong while creating Tweet")
                }
            
            return res.status(201).json(
                    new ApiResponse(200,createdTweet,"Tweet created successfully")
                )
})

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets
    const userId = req.user?._id;
    /*const tweets = await Tweet.aggregate([
    {
        $match: {
            owner: new mongoose.Types.ObjectId(userId)
        }
    },
    {
        $lookup: {
            from: "users",
            localField: "owner",
            foreignField: "_id",
            as: "owner",
            pipeline: [
                {
                    $project: {
                        fullName: 1,
                        username: 1,
                        avatar: 1
                    }
                }
            ]
        }
    },
    {
        $addFields: {
            owner: { $first: "$owner" }
        }
    }
]);*/
const tweets = await Tweet.find({ owner: userId })
    .populate("owner", "fullName username avatar");

         if(!tweets || tweets.length ==0)
         {
            throw new ApiError(404, "Tweets Not Found")
         }
          return res.status(200)
              .json(
                 new ApiResponse(200, tweets,"tweets fetched successfully")
              )
})

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet
    const { tweetId } = req.params
    const { content} = req.body
    const tweet = await Tweet.findByIdAndUpdate(tweetId,
        {
            $set : {
                content
            }
        },
        {new : true}
    ).select("-updatedAt -createdAt")
        if(!tweet)
        {
            throw new ApiError(400, "Invalid Tweet")
        }
        return res
            .status(200)
            .json(new ApiResponse(200, tweet , "Tweet Updated Successfully"))

})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}