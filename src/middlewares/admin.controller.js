import { asyncHandler } from "../utils/Asynchandller.js";
import { ApiError } from "../utils/apiError.js";


export const adminOrNot = asyncHandler(async(req, res, next)=> {
    console.log("hello");
    
    if (req.user?.role !== "admin") {
        throw new ApiError(403, "Admin access required")
    }

    next()
})