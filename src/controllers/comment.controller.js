import mongoose from "mongoose"
import {Comment} from "../models/comment.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const {videoId} = req.params
    const {page = 1, limit = 10} = req.query

})

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
    const {videoId} = req.params
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
        const comment = await Comment.create ({
            content,
            owner : owner._id,
            video : videoId
        })

        const createdComment= await Comment.findById(comment._id)
            
             if(!createdComment){
                    throw new ApiError(500,"Something went wrong while creating Comment")
                }
            
            return res.status(201).json(
                    new ApiResponse(201,createdComment,"Commentcreated successfully")
                )
})

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
    const commentId = req.params
    const {content} = req.body
    if (
                content.trim() === ""
            ){
                throw new ApiError(400,"All fields are required")
            }

    const updatedComment= await Comment.findByIdandUpdate(commentId , {
        $set : {
            content
        }
    },{new : true})

    if(!updatedComment)
    {
        throw new ApiError(404, "Comment Not Found")
    }

    return res.status(200)
    .json(
        new ApiResponse(200, updatedComment , "Comment Updated Successfully")
    )
})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
    const commentId = req.params
    const comment = await Tweet.findById(commentId)
        if(!comment)
        {
            throw new ApiError(404, "Comment Not Found")
        }
        await Tweet.deleteOne({ _id: commentId }); 
    
         return res
                .status(200)
                .json(new ApiResponse(200,  "Comment Deleted Successfully"))
})

export {
    getVideoComments, 
    addComment, 
    updateComment,
     deleteComment
    }