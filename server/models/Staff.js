const mongoose = require("mongoose");

const staffSchema = new mongoose.Schema(
    {
        accountType: {
            type: String,
            enum: ["Residence building", "Campus department"],
            required: true
        },
        organizationName: {
            type: String,
            required: true,
            trim: true
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },
        passwordHash: {
            type: String,
            required: true,
            select: false
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model("Staff", staffSchema);
