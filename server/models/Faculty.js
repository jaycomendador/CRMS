const mongoose = require("mongoose");

const facultySchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },
        email: {
            type: String,
            required: true,
            trim: true,
            lowercase: true
        },
        department: {
            type: String,
            required: true,
            trim: true
        },
        role: {
            type: String,
            default: "Professor"
        },
        assignedBuilding: {
            type: String,
            default: "Main Campus"
        },
        assignedRoom: {
            type: String,
            default: ""
        },
        phone: {
            type: String,
            default: ""
        },
        status: {
            type: String,
            enum: ["Active", "On leave", "Inactive"],
            default: "Active"
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model("Faculty", facultySchema);
