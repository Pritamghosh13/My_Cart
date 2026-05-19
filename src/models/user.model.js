import mongoose, {Schema} from "mongoose";
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import dotenv from "dotenv"


dotenv.config({
    path:"./.env"
})

const userSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },

    fullName: {
      type: String,
      required: true,
      trim: true
    },

    password: {
      type: String,
      required: true
    },

    avatar: {
        url: {
            type: String,
            default: ""
        },

        public_id: {
            type: String,
            default: ""
        }
    },

    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user"
    },

    refreshToken: {
      type: String
    },

    addresses: [
      {
        country: {
        type: String,
        required: true
        },
        city: {
        type: String,
        required: true
        },
        state: {
        type: String,
        required: true
        },
        postalCode: String,
        addressLine: String,
        phoneNumber: String
      }
    ]
  },
  {
    timestamps: true
  }
);


//hashing password.
userSchema.pre("save", async function(){
    if (!this.isModified("password")) return;

    this.password = await bcrypt.hash(this.password, 10)
})


//checking the password
userSchema.methods.isPasswordCorrect = async function (password){
    return await bcrypt.compare(password, this.password)
}



//generating access Token
userSchema.methods.generateAccessToken = function(){
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            username: this.username,
            fullName: this.fullName,

        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}



//generating Refresh Token
userSchema.methods.generateRefreshToken = function(){
    return jwt.sign(
        {
            _id: this._id,

        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}




















export const User = mongoose.model("User", userSchema)