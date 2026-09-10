const mongoose = require("mongoose");

const roomSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },
        building: {
            type: String,
            required: true,
            trim: true
        },
        type: {
            type: String,
            enum: ["Single room", "Double room", "Faculty suite", "Conference room", "Lab"],
            default: "Single room"
        },
        capacity: {
            type: Number,
            default: 1
        },
        status: {
            type: String,
            enum: ["Available", "Occupied", "Reserved", "Under maintenance"],
            default: "Available"
        },
        assignedTo: {
            type: String,
            default: ""
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model("Room", roomSchema);
