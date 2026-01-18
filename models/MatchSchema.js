import mongoose from "mongoose";
const { Schema } = mongoose;

const MatchSchema = new Schema({
    propertyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "appartments"
    },
    matchLikedBy: {
        type: {
            buyerId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "buyers"
            },
            likedAt: Date
        }
    },
    matchAcceptedBy: {
        type: {
            sellerId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "sellers"
            },
            likedAt: Date
        },
        default: null
    },
    status: {
        type: [String],
        enum: ["Requested", "Matched"],
        default: ["Requested"]
    }
}, {
    timestamps: true,
});
const MatchModel = mongoose.model("matches", MatchSchema);
export default MatchModel;
