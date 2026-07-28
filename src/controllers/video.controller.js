import mongoose, {isValidObjectId, Mongoose} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary,deleteFromCloudinary} from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination
})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description , duration} = req.body
    // TODO: get video, upload to cloudinary, create video
    if (
            [title,description].some((field)=> field?.trim() === "")
        ){
            throw new ApiError(400,"All fields are required")
        }
    console.log(req.files)

    const videoLocalPath = req.files?.videoFile[0]?.path
    const thumbnailLocalPath = req.files?.thumbnail[0]?.path
    if(!videoLocalPath)
    {
        throw new ApiError(401, "No video uploaded")
    }
    if(!thumbnailLocalPath)
    {
        throw new ApiError(401 , "No Thumbnail uploaded")
    }

    const owner = await User.findById(req.user?._id).select("-password")
    if(!owner)
    {
        throw new ApiError(402, "Invalid Authorization")
    }
    console.log("Got owner")

    const videoFile = await uploadOnCloudinary(videoLocalPath)
    if(!videoFile)
    {
        throw new ApiError(400, "Error occured while uploading video")
    }
    console.log("Video Uploaded")
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)
    if(!thumbnail)
    {
        throw new ApiError(400 , "Error occured while uploading thumbnail")
    }
    console.log("Image Uploaded")
     const video = await Video.create({
            title,
            description,
            duration,
            videoFile : videoFile.url,
            thumbnail : thumbnail.url,
            owner : owner._id
        })
    
    const createdVideo = await Video.findById(video._id)
    
     if(!createdVideo){
            throw new ApiError(500,"Something went wrong while creating Video")
        }
    
    return res.status(201).json(
            new ApiResponse(200,createdVideo,"Video created successfully")
        )

})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if(!videoId)
    {
        throw new ApiError(404,"Please give video Id")
    }
    //TODO: get video by id
    //const id = new mongoose.Types.ObjectId(videoId)
    const video = await Video.findById(videoId).select("-duration -isPublished")
    if(!video)
    {
        throw new ApiError(400, "Video Not Found")
    }
    return res.status(201).json(
        new ApiResponse(200,video,"Video Fetched successfully")
    )
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail
    const { title, description} = req.body
    const thumbnailLocalPath = await req.file?.path
    if(!thumbnailLocalPath)
    {
        throw new ApiError(404,"Thumbnail not Found")
    }

    const video = await Video.findById(videoId).select("-duration -views -isPublished -updatedAt -createdAt")
    if(!video)
    {
        throw new ApiError(400, "Invalid Video")
    }

        const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)
    
        if(!thumbnail.url){
            throw new ApiError(400, "Error while uploading coverImage")
        }
        
        
        if (video.thumbnail) {
        await deleteFromCloudinary(video.thumbnail);
    }
    
        console.log("previous thumbnail deleted successfully")
        
        video.thumbnail = thumbnail.url
        video.title = title
        video.description = description
        await video.save({validateBeforeSave : false})

        return res
            .status(200)
            .json(
                new ApiResponse(200, video , "Video update successfully")
            )

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video
    const video = await Video.findById(videoId)
    if(!video)
    {
        throw new ApiError(404,"Video Not Found")
    }

   if(video.thumbnail)
   {
        await deleteFromCloudinary(video.thumbnail)
   }

   await deleteFromCloudinary(video.videoFile)
   await Video.deleteOne({ _id: videoId });
   
   return res
            .status(200)
            .json(new ApiResponse(200,  "Video Deleted Successfully"))
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    const video = await Video.findByIdAndUpdate(
    videoId,
    [
        {
            $set: {
                isPublished: { $not: "$isPublished" }
            }
        }
    ],
    { new: true }
    ).select("-duration -views -updatedAt -createdAt");

    if(!video)
    {
        throw new ApiError(404, "Video Not Found")
    }
    return res
            .status(200)
            .json(
                new ApiResponse(200, video , "Video publish update successfully")
            )

})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}