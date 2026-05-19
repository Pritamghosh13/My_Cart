
import { User } from "../models/user.model.js";
import { asyncHandler } from "../utils/Asynchandller.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";



const userRegister = asyncHandler(async(req, res) => {
    const { username, email, fullName, password } = req.body
    
    const addresses = JSON.parse(req.body.addresses);

    console.log(req.body);
    let role;

    if (
        [fullName, email, password, username].some((field) =>!field || field?.trim() ==="")
    ) {
        throw new ApiError(400, "All fields are required")
    }


    const existingUser = await User.findOne({
        $or: [{username}, {email}]
    })

    if(existingUser){
        throw new ApiError(409, "User with email or username already exists")
    }

    const avatarlocalPath =  req.file?.path;

    console.log(avatarlocalPath);

    let avatar = {
        url: "",
        public_id: ""
    }

    if(avatarlocalPath){
        const response = await uploadOnCloudinary(avatarlocalPath)

        if (response) {
        avatar.url = response.url;
        avatar.public_id = response.public_id;
    }
    }
    
    



    const user = await User.create({
        fullName,
        username,
        password,
        email,
        role,
        addresses,
        avatar
    })


    const createdUser = await User.findById(user._id).select("-password -refreshToken")

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user")
    }

    return res.status(201)
    .json(new ApiResponse(201, createdUser, "User register Successfully"))



    
    
})


export {
    userRegister

}