import mongoose, { Schema } from "mongoose";

const productSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },

    description: {
      type: String,
      required: true
    },

    price: {
      type: Number,
      required: true
    },

    stock: {
      type: Number,
      required: true,
      default: 0
    },

    category: {
      type: String,
      required: true
    },

    brand: {
      type: String
    },

    images: [
      {
        url: {
          type: String,
          default: ""
        },

        public_id: {
          type: String,
          default: ""
        }
      }
    ],

    thumbnail: {
      url: {
          type: String,
          default: ""
        },

        public_id: {
          type: String,
          default: ""
        }
    },

    ratings: {
      type: Number,
      default: 0
    },

    numOfReviews: {
      type: Number,
      default: 0
    },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User"
    }
  },
  {
    timestamps: true
  }
);

export const Product = mongoose.model("Product", productSchema);