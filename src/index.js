import {app} from "./app.js"
import connectDB from "./DB/db.js"


connectDB() 
    .then(() => {
        app.listen(process.env.PORT || 8000, () => {
            console.log(`Server is running at port : ${process.env.PORT}`);

        })

        app.on("error", (error) => {  //for server errors.
            console.log("ERROR:", error)
        })

    })
    .catch((error) => {   //for DB related error.
        console.log("MongoDB connection failed !! ", error);

})





