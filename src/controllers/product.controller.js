
import { User } from "../models/user.model.js";
import { asyncHandler } from "../utils/Asynchandller.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { Product } from "../models/products.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";



//adding products.
const addproduct = asyncHandler(async(req, res) => {
    console.log("hello");
    
    const {title, description, price, stock, category, brand} = req.body;

    if (
        [title, description, price, stock, category].some((field) =>!field || field?.trim() ==="")
    ) {
        throw new ApiError(400, "All fields are required")
    }

    const files = req.files;
    console.log(files);
    

    let uploadImages = [];

    if(files && files.length > 0){
        for(const file of files){
            const response = await uploadOnCloudinary(file.path);

            if(response){
                uploadImages.push({
                    url: response.url,
                    public_id: response.public_id
                })
            }
        }
    }


    const product = await Product.create({
        title,
        description,
        price,
        stock,
        category,
        brand: brand || "",
        images: uploadImages,
        createdBy: req.user?._id
    })

    return res.status(200)
    .json(new ApiResponse(200, product, "Your product added successfully"))

})









export {
    addproduct,

}