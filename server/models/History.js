const mongoose = require("mongoose");

const historySchema = new mongoose.Schema(
    {
        room: {
            type: String,
            required: true,
            trim: true
        },
        building: {
            type: String,
            required: true,
            trim: true
        },
        person: {
            type: String,
            required: true,
            trim: true
        },
        action: {
            type: String,
            enum: ["Room Reserved", "Room Assigned", "Key Card Issued", "Inspection Completed", "Room Checked Out", "Maintenance Logged"],
            default: "Room Reserved"
        },
        status: {
            type: String,
            enum: ["Completed", "Active", "Returned", "Cancelled"],
            default: "Completed"
        },
        staff: {
            type: String,
            default: "Staff Admin"
        },
        notes: {
            type: String,
            default: ""
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model("History", historySchema);
