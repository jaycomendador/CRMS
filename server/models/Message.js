const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
    {
        facultyId: {
            type: String,
            default: "",
            index: true
        },
        department: {
            type: String,
            default: "",
            index: true
        },
        sender: {
            type: String,
            enum: ["admin", "faculty", "bot", "system"],
            required: true
        },
        senderName: {
            type: String,
            default: ""
        },
        senderEmail: {
            type: String,
            default: ""
        },
        text: {
            type: String,
            required: true,
            trim: true
        },
        room: {
            type: String,
            default: ""
        },
        emailDispatched: {
            type: Boolean,
            default: false
        },
        emailRecipient: {
            type: String,
            default: ""
        },
        emailPreviewUrl: {
            type: String,
            default: ""
        },
        readByAdmin: {
            type: Boolean,
            default: false
        },
        readByFaculty: {
            type: Boolean,
            default: false
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model("Message", messageSchema);
