import mongoose from "mongoose"
import {Video} from "../models/video.model.js"
import {Subscription} from "../models/subscription.model.js"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getChannelStats = asyncHandler(async (req, res) => {
    const channelId = req.params.channelId;

    const subscriberCount = await Subscription.countDocuments({
        channel: new mongoose.Types.ObjectId(channelId)
    });


    const videos = await Video.aggregate([
        { $match:
             { 
                owner: new mongoose.Types.ObjectId(channelId) 
            } 
        },
      
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "video",
                as: "videoLikes"
            }
        },
        
        {
            $addFields: {
                likeCount: { $size: "$videoLikes" }
            }
        },
        
        {
            $project: {
                likeCount: 1
            }
        }
    ]);


    const likeCount = videos.reduce((sum, v) => sum + v.likeCount, 0);


    const videoCount = videos.length;

    return res.status(200).json(
        new ApiResponse(200, {
        subscriberCount,
        videoCount,
        likeCount
        }, "Channel stats fetched successfully")
    );
});

const getChannelVideos = asyncHandler(async (req, res) => {
    // TODO: Get all the videos uploaded by the channel
})

export {
    getChannelStats, 
    getChannelVideos
    }