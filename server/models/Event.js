const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true
        },
        category: {
            type: String,
            enum: ["Inspection", "Maintenance", "Move-in", "Reservation", "Event"],
            default: "Event"
        },
        date: {
            type: String, // YYYY-MM-DD
            required: true
        },
        startTime: {
            type: String,
            default: "09:00"
        },
        endTime: {
            type: String,
            default: "10:00"
        },
        room: {
            type: String,
            default: ""
        },
        assignedTo: {
            type: String,
            default: ""
        },
        status: {
            type: String,
            enum: ["Scheduled", "In progress", "Completed", "Cancelled"],
            default: "Scheduled"
        },
        notes: {
            type: String,
            default: ""
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model("Event", eventSchema);
