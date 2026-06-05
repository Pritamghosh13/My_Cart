
import { Product } from "../models/products.model.js";
import { User } from "../models/user.model.js";
import { asyncHandler } from "../utils/Asynchandller.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import {v2 as cloudinary} from "cloudinary"
import jwt from "jsonwebtoken";




//generating access or refreshToken
const generateAccessAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken;
        await user.save({validateBeforeSave: false}) //saving

        return {accessToken, refreshToken}


        
    } catch (err) {
        console.log(err);
        throw new ApiError(500, "ERROR while generating the access and refresh token")
        
    }
}


//refresh access and refresh token
const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if (!incomingRefreshToken) {
        throw new ApiError(401, "unauthorized request") 
    }

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken, 
            process.env.REFRESH_TOKEN_SECRET
        )
    
        
        const user = await User.findById(decodedToken._id)
    
        if (!user) {
            throw new ApiError(401, "Invalid refresh token") 
        }
    
        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh token is expired or used") 
        }
    
        const {accessToken, refreshToken} = await generateAccessAndRefreshToken(user._id)
    
        const options = {
            httpOnly: true,
            secure: true
        }
    
        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200, 
                {
                    accessToken, 
                    refreshToken,
                },
                "Access token refreshed"
            )
        )
    } catch (err) {
        throw new ApiError(401, err?.message || "Invalid refresh token")
    }
})



//register a user.
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

    // console.log(avatarlocalPath);

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



//log in a user 
const userLoggedIn = asyncHandler(async(req, res) => {
    const {username, email, password} = req.body;

    if(!(username || email)){
        throw new ApiError(400, "username or email is required")
    }   

    if (!password) {
        throw new ApiError(400, "Password field is empty")
    }


    const user = await User.findOne({
        $or: [{username}, {email}]
    })

    if (!user) {
        throw new ApiError(404, "User not found")
    }

    const verifyPassword = await user.isPasswordCorrect(password)

    if (!verifyPassword) {
        throw new ApiError(401, "Invalid user credentials")
    }

    const {accessToken, refreshToken} = await generateAccessAndRefreshToken(user._id)

    const loggedUser = await User.findById(user._id).select("-password -refreshToken")


    //for safty of cookies.
    const options = {
        httpOnly: true,
        secure: true,
    }

    return res.status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(new ApiResponse(200, loggedUser, "User logged in successfully"))

})


//log out a user.
const userLogOut = asyncHandler(async(req, res) => {
    
    await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {refreshToken: null}
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true,
    }


    return res.status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out"))


}) 


//change password
const changeUserPassword = asyncHandler(async(req, res) => {
    const {oldPassword, newPassword, confrimPassword} = req.body

    const user = await User.findById(req.user?._id)

    if (!user) {
        throw new ApiError(404, "User not found")
    }

    if(newPassword !== confrimPassword){
        throw new ApiError(401, "The password is have to same in both filed")
    }


    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if (!isPasswordCorrect) {
        throw new ApiError(401, "User credintials incorrect")
    }

    user.password = newPassword;

    await user.save()


    return res.status(200)
    .json(new ApiResponse(200, {}, "Password updated successfully"))

})



//get current user profile
const getCurrentUser = asyncHandler(async (req, res) => {

    const user = await User.findById(req.user?._id)
    .select("-password -refreshToken");

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    return res.status(200).json(
        new ApiResponse(
            200,
            user,
            "Current user fetched successfully"
        )
    );

});


//update user profile details
const updateProfile = asyncHandler(async (req, res) => {

    const { fullName, email, username } = req.body;

    const user = await User.findById(req.user?._id);

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    // update fields only if provided
    if (fullName?.trim()) {
        user.fullName = fullName;
    }

    if (email?.trim()) {
        user.email = email;
    }

    if (username?.trim()) {
        user.username = username;
    }

    await user.save({ validateBeforeSave: false });

    const updatedUser = await User.findById(user._id)
    .select("-password -refreshToken");

    return res.status(200).json(
        new ApiResponse(
            200,
            updatedUser,
            "Profile updated successfully"
        )
    );

});



//update the avatar
const updateAvatar = asyncHandler(async (req, res) => {
    const user = await User.findOne({
        _id: req.user?._id
    })

    if (!user) {
        throw new ApiError(404, "User not found")
    }

   if (user.avatar.public_id) {
    await cloudinary.uploader.destroy(user.avatar.public_id)
   }
   
   const avatarlocalPath = req.file?.path;
   
   if (!avatarlocalPath) {
      throw new ApiError(400, "Avatar file is required");
   }

   const response = await cloudinary.uploader.upload(avatarlocalPath)

   user.avatar.url = response.url
   user.avatar.public_id = response.public_id
   
   await user.save();

   return res.status(200)
   .json(new ApiResponse(200, user, "Your avatar updated successfully"))

})



//delete the user account
const deleteUserAccount = asyncHandler(async (req, res) => {
    console.log("Hello, this is controller");
    
    const user = await User.findById(req.user?._id)

    if (!user) {
        throw new ApiError(404, "user not found");
    }

    if(user.avatar.public_id){
        await cloudinary.uploader.destroy(user.avatar.public_id)
    }

    const products = await Product.find({
        createdBy: req.user?._id
    })

    for(const product of products){
        for(const image of product.images){
            if(image.public_id){
                await cloudinary.uploader.destroy(image.public_id)
            }
        }
    }

    await User.findByIdAndDelete(user._id)

    await Product.deleteMany({
        createdBy: user._id
    })


    return res.status(200)
    .json(new ApiResponse(200, {}, "User account deleted successfully"))
})



export {
    userRegister,
    userLoggedIn,
    userLogOut,
    changeUserPassword,
    getCurrentUser,
    updateProfile,
    updateAvatar,
    deleteUserAccount,
    refreshAccessToken

}