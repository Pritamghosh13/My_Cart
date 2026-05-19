import { v2 as cloudinary } from 'cloudinary'
import { log } from 'console';
import fs from "fs"
import dotenv from "dotenv"


dotenv.config({
    path: "./.env"
})

cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET
});

//uploading file from localstorage to cloudinary
const uploadOnCloudinary = async (localFilePath) => {
    try {
        if(!localFilePath) return null;
        
        //upload the file on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        })
        //file hass been uploaded on cloudinary.
        fs.unlinkSync(localFilePath);
        console.log("File is uploaded on cloudinary", response.url);
        
        return response
        
    

    } catch (error) {
        console.log("Cloudinary upload error:", error);

        if (fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath);
        }

        return null;
    }
}

export {uploadOnCloudinary}