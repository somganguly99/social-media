import { v2 as cloudinary } from 'cloudinary';
import fs from "fs";/* Default Node JS file system */

cloudinary.config({ 
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
        api_key: process.env.CLOUDINARY_API_KEY, 
        api_secret: process.env.CLOUDINARY_API_SECRET // Click 'View API Keys' above to copy your API secret
    });
/* Thought process : upload on local server , then from there upload on cloudinary , once done delete from local server . 
Helps proffesionally in case we need to upload again */
const uploadOnCloudinary = async (localFilePath) => {
    try {
        if(!localFilePath) return null;
        //uplaod file on cloudinary
       const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"            
        })
        //file has been uploaded successfully
        //console.log("File uploaded successfully", response.url)
        fs.unlinkSync(localFilePath)
        console.log(response)
        return response;
    } catch (error) {
        fs.unlinkSync(localFilePath)// remove locally saved temporary file as upload operation failed
        return null;
    }
}

export {uploadOnCloudinary};