import {DB_name} from "../constans.js"
import mongoose from "mongoose"
import dotenv from "dotenv"

dotenv.config({
    path:"./.env"
})



const connectDB = async () => {   //async- await always returns a promise.
    try {
        const connectionInstance = await mongoose.connect(`${process.env.Mongodb_url}/${DB_name}`)
        console.log(`\nMongooDB connected !! DB Host: ${connectionInstance.connection.host}`);
        
    } catch (error) {
        console.log("MongoDB connection failed !! ",error);
        process.exit(1)
    }
}

export default connectDB
