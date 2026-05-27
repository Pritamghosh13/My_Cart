
import { User } from "../models/user.model.js";
import { asyncHandler } from "../utils/Asynchandller.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { Product } from "../models/products.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { v2 as cloudinary} from "cloudinary"


//adding products.
const addproduct = asyncHandler(async(req, res) => {
    console.log("hello");
    
    const {title, description, price, stock, category, brand} = req.body;

    if (
    !title?.trim() ||
    !description?.trim() ||
    !category?.trim() ||
    price == null ||
    stock == null
    ) {
        throw new ApiError(400, "All required fields must be provided");
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


//updating product details
const updateProductDetails = asyncHandler(async (req, res) => {
    console.log("upadting controller works");
    
    const {title, description, price, stock} = req.body;

    const {productId} = req.params;


    // if (
    // !title?.trim() ||
    // !description?.trim() ||
    // price == null ||
    // stock == null
    // ) {
    //     throw new ApiError(400, "All required fields must be provided");
    // }

    const product = await Product.findOne({
        createdBy: req.user?._id,
        _id: productId
    })

    if (!product) {
        throw new ApiError(404, "Product not found")
    }

    if (title?.trim()) {
        product.title = title;
    }

    if (description?.trim()) {
        product.description = description;
    }

    if (price != null) {
        product.price = price;
    }

    if (stock != null) {
        product.stock = stock;
    }


    const files = req.files;

    

    if( files && files.length > 0 ){
        // let updatedImage = [];

       
        for (const image of product.images){
            if(image.public_id){
                await cloudinary.uploader.destroy(image.public_id)
            }
        }

        product.images = [];


        for(const file of files){
            
            const response = await uploadOnCloudinary(file.path)

                if(response){
                    product.images.push({
                        url: response.url,
                        public_id: response.public_id
                    })
                }
        }

    }

    await product.save()


    return res.status(200)
    .json(new ApiResponse(200, product, "Product details updated successfully"))






})


//deleting a product 
const deleteProduct = asyncHandler(async (req, res) => {
    const {productId} = req.params;
 

    const product = await Product.findOne({
        _id: productId,
        createdBy: req.user?._id
    })

    if (!product) {
        throw new ApiError(404, "Product Not Found")
    }

    //deleting the images of product.
    for (const image of product.images){
            if(image.public_id){
                await cloudinary.uploader.destroy(image.public_id)
        }
    }

    await Product.findByIdAndDelete(productId)


    return res.status(200)
    .json(new ApiResponse(200, {}, "Your product deleted successfully"))
})








export {
    addproduct,
    updateProductDetails,
    deleteProduct

}



