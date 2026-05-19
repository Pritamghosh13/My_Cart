import mongoose, { Schema } from "mongoose";

const orderSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    orderItems: [
      {
        product: {
          type: Schema.Types.ObjectId,
          ref: "Product",
          required: true
        },

        title: String,

        image: String,

        price: {
          type: Number,
          required: true
        },

        quantity: {
          type: Number,
          required: true
        }
      }
    ],

    shippingAddress: {
      country: String,
      city: String,
      state: String,
      postalCode: String,
      addressLine: String,
      phoneNumber: String
    },

    paymentInfo: {
      id: String,
      status: String
    },

    paymentMethod: {
      type: String,
      enum: ["COD", "CARD", "UPI"],
      default: "COD"
    },

    itemsPrice: {
      type: Number,
      required: true
    },

    taxPrice: {
      type: Number,
      default: 0
    },

    shippingPrice: {
      type: Number,
      default: 0
    },

    totalPrice: {
      type: Number,
      required: true
    },

    orderStatus: {
      type: String,
      enum: [
        "Processing",
        "Shipped",
        "Out for Delivery",
        "Delivered",
        "Cancelled"
      ],
      default: "Processing"
    },

    deliveredAt: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

export const Order = mongoose.model("Order", orderSchema);