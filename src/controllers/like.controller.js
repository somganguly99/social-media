import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    //TODO: toggle like on video
        const userId = req.user._id; 
       
    
        const existingLike = await Like.findOne({
        likedBy: userId,
        video: videoId
      });
    
      let result;
    
      if (existingLike) {
        
        await Like.deleteOne({ _id: existingLike._id });
    
        result = { liked: false };
      } else {
        
        await Like.create({
          likedBy: userId,
          video: videoId
        });
    
        result = { liked: true };
      }
    
      return res.status(200).json(
        new ApiResponse(200, result, "Like toggled successfully")
      );
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    //TODO: toggle like on comment
    const userId = req.user._id
    const existingLike = await Like.findOne({
        likedBy : userId,
        comment : commentId
    })
    let result;
    if(existingLike)
    {
        await Like.deleteOne({_id : existingLike._id})
        result = { liked :false}
    }
    else {
        await Like.create({
            likedBy : userId,
            comment : commentId
        })
        result = {liked : true}
    }
    return res.status(200).json(
        new ApiResponse(200, result, "Like toggled successfully")
      );
})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    //TODO: toggle like on tweet
    const userId = req.user._id
    const existingLike = await Like.findOne({
        likedBy : userId,
        tweet : tweetId
    })
    let result;
    if(existingLike)
    {
        await Like.deleteOne({_id : existingLike._id})
        result = { liked :false}
    }
    else {
        await Like.create({
            likedBy : userId,
            comment : tweetId
        })
        result = {liked : true}
    }
    return res.status(200).json(
        new ApiResponse(200, result, "Like toggled successfully")
      );
}
)

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos
    const videos = await Like.aggregate([
        {
            $match : {
                likedBy : new mongoose.Types.ObjectId(req.user._id)
            }
        }, {
            $lookup : {
                from : "videos",
                localField : "video",
                foreignField : "_id",
                as : "video",
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
                                        avatar : 1
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
                    }, 
                    {
                        $project : {
                            videoFile : 1,
                            thumbnail : 1, 
                            title : 1,
                            description : 1, 
                            duration : 1,
                            owner : 1
                        }
                    }
                ]
            }
        }, {
            $addFields : {
                video : {
                    $first : "$video"
                }
            }
        }, {
                $replaceRoot: {
                    newRoot: "$video"
            }
  }
    ])

    if(videos.length ===0 )
    {
        throw new ApiError(404, "No Liked Videos")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, videos , "All Liked Videos")
    )
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}