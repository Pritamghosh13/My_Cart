
import { User } from "../models/user.model.js";
import { asyncHandler } from "../utils/Asynchandller.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";



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


export {
    userRegister,
    userLoggedIn,
    userLogOut

}