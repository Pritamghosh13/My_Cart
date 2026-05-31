import express from "express"
import cookieParser from "cookie-parser"



const app = express()



app.use(express.json({limit: "16kb"}))
app.use(express.urlencoded({extended: true, limit: "16kb"}))
app.use(express.static("public"))
app.use(cookieParser())



import userRouter from "./routes/user.routes.js"
import productRouter from "./routes/product.routes.js"
import cartRouter from "./routes/cart.routes.js"

app.use("/api/v1/user", userRouter)


app.use("/api/v1/user/product", productRouter)


app.use("/api/v1/user/cart", cartRouter)






export {app}