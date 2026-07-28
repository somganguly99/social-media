import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.model.js"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const createPlaylist = asyncHandler(async (req, res) => {
    const {name, description} = req.body

    //TODO: create playlist
     if (
                [name,description].some((field)=> field?.trim() === "")
            ){
                throw new ApiError(400,"All fields are required")
            }
        const owner = await User.findById(req.user?._id).select("-password")
            if(!owner)
            {
                throw new ApiError(402, "Invalid Authorization")
            }

            const playlist = await Playlist.create({
                    name,
                    description,
                    owner : owner._id
                })
            
            const createdPlaylist = await Playlist.findById(playlist._id)
            
             if(!createdPlaylist){
                    throw new ApiError(500,"Something went wrong while creating Playlist")
                }
            
            return res.status(201).json(
                    new ApiResponse(200,createdPlaylist,"Playlist created successfully")
                )
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const {userId} = req.params
    //TODO: get user playlists
    const playlists = await Playlist.aggregate([
            {
                $match : {
                    owner : new mongoose.Types.ObjectId(userId)
                }
            }, {
                $lookup : {
                    from : "users",
                    localField : "owner",
                    foreignField : "_id",
                    as : "owner",
                    pipeline : [
                        {
                            $project : {
                                fullName :1,
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
        ])
         if(playlists.length ===0)
            {
                throw new ApiError(404, "User doesnt have any playlists")
            }
            return res.status(200)
                  .json(
                     new ApiResponse(200, playlists,"playlists fetched successfully")
                  )
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    //TODO: get playlist by id
    const playlist = Playlist.findById(playlistId)
    if(!playlist)
    {
        throw new ApiError(404, "Playlist Not Found")
    }
    return res.status(200)
                  .json(
                     new ApiResponse(200, playlist,"Playlist fetched successfully")
                  )
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $push : {
                videos : videoId
            }
        }, {
            new :true
        }
    ).select("-updatedAt -createdAt")

    if(!updatePlaylist)
    {
        throw new ApiError(404, "Playlist Not Found")
    }

     return res
        .status(200)
        .json(new ApiResponse(200,updatedPlaylist,"Video Added to Playlist Successfully"))
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    // TODO: remove video from playlist
     const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $pull : {
                videos : videoId
            }
        }, {
            new :true
        }
    ).select("-updatedAt -createdAt")

    if(!updatePlaylist)
    {
        throw new ApiError(404, "Playlist Not Found")
    }

     return res
        .status(200)
        .json(new ApiResponse(200,updatedPlaylist,"Video Added to Playlist Successfully"))
})

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    // TODO: delete playlist
        const playlist = await Playlist.findById(playlistId).select("-updatedAt -createdAt")
        if(!playlist)
        {
            throw new ApiError(404, "Playlist Not Found")
        }
        await Playlist.deleteOne({ _id: playlistId }); 
    
         return res
                .status(200)
                .json(new ApiResponse(200,  "Playlist Deleted Successfully"))
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body
    //TODO: update playlist

    const playlist = await Playlist.findByIdAndUpdate(playlistId, {
        $set : {
            name,
            description
        }
    }, {new : true}).select("-updatedAt -createdAt")

    if(!playlist)
    {
        throw new ApiError(404, "Playlist not Found")
    }

    return res
        .status(200)
        .json(new ApiResponse(200,playlist ,"Playlist Updated Successfully"))
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}