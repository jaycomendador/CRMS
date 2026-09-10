const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const crypto = require("crypto");
require("dotenv").config();
const Staff = require("./models/Staff");
const Event = require("./models/Event");
const Faculty = require("./models/Faculty");
const Room = require("./models/Room");
const History = require("./models/History");

const app = express();

app.use(cors());
app.use(express.json());

mongoose
    .connect(process.env.MONGO_URI, {
        serverSelectionTimeoutMS: 5000
    })
    .then(() => {
        console.log("MongoDB connected");
    })
    .catch((error) => {
        console.error("MongoDB connection error:", error);
    });

function hashPassword(password) {
    return new Promise((resolve, reject) => {
        crypto.scrypt(password, process.env.PASSWORD_PEPPER || "roomwise-development-pepper", 64, (error, derivedKey) => {
            if (error) reject(error);
            else resolve(derivedKey.toString("hex"));
        });
    });
}

async function passwordsMatch(password, passwordHash) {
    const hashedPassword = await hashPassword(password);
    const storedPassword = Buffer.from(passwordHash, "hex");
    const providedPassword = Buffer.from(hashedPassword, "hex");
    return storedPassword.length === providedPassword.length && crypto.timingSafeEqual(storedPassword, providedPassword);
}

app.post("/api/auth/register", async (req, res) => {
    try {
        const { accountType, organizationName, email, password } = req.body;

        if (!accountType || !organizationName || !email || !password) {
            return res.status(400).json({ message: "Complete all staff account fields." });
        }
        if (password.length < 8) {
            return res.status(400).json({ message: "Password must be at least 8 characters." });
        }

        const normalizedEmail = email.trim().toLowerCase();
        const existingStaff = await Staff.findOne({ email: normalizedEmail });
        if (existingStaff) {
            return res.status(409).json({ message: "A staff account already exists for this email." });
        }

        const staff = await Staff.create({
            accountType,
            organizationName,
            email: normalizedEmail,
            passwordHash: await hashPassword(password)
        });

        return res.status(201).json({
            message: "Staff account created successfully.",
            staff: { id: staff._id, accountType: staff.accountType, organizationName: staff.organizationName, email: staff.email }
        });
    } catch (error) {
        console.error("Staff registration error:", error);
        return res.status(500).json({ message: "Unable to create the staff account." });
    }
});

app.post("/api/auth/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        const normalizedEmail = email?.trim().toLowerCase();

        if (!normalizedEmail || !password) {
            return res.status(400).json({ message: "Enter your staff email and password." });
        }

        const staff = await Staff.findOne({ email: normalizedEmail }).select("+passwordHash");
        if (!staff || !(await passwordsMatch(password, staff.passwordHash))) {
            return res.status(401).json({ message: "Invalid staff email or password." });
        }

        return res.json({
            message: "Signed in successfully.",
            staff: { id: staff._id, accountType: staff.accountType, organizationName: staff.organizationName, email: staff.email }
        });
    } catch (error) {
        console.error("Staff login error:", error);
        return res.status(500).json({ message: "Unable to sign in right now." });
    }
});

// Calendar Event Routes
app.get("/api/events", async (req, res) => {
    try {
        const events = await Event.find().sort({ date: 1, startTime: 1 });
        return res.json(events);
    } catch (error) {
        console.error("Get events error:", error);
        return res.status(500).json({ message: "Failed to fetch events." });
    }
});

app.post("/api/events", async (req, res) => {
    try {
        const newEvent = await Event.create(req.body);
        return res.status(201).json(newEvent);
    } catch (error) {
        console.error("Create event error:", error);
        return res.status(400).json({ message: "Failed to create event." });
    }
});

app.put("/api/events/:id", async (req, res) => {
    try {
        const updatedEvent = await Event.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updatedEvent) return res.status(404).json({ message: "Event not found." });
        return res.json(updatedEvent);
    } catch (error) {
        console.error("Update event error:", error);
        return res.status(400).json({ message: "Failed to update event." });
    }
});

app.delete("/api/events/:id", async (req, res) => {
    try {
        const deletedEvent = await Event.findByIdAndDelete(req.params.id);
        if (!deletedEvent) return res.status(404).json({ message: "Event not found." });
        return res.json({ message: "Event deleted successfully." });
    } catch (error) {
        console.error("Delete event error:", error);
        return res.status(500).json({ message: "Failed to delete event." });
    }
});

// Faculty Routes
app.get("/api/faculty", async (req, res) => {
    try {
        const facultyList = await Faculty.find().sort({ createdAt: -1 });
        return res.json(facultyList);
    } catch (error) {
        console.error("Get faculty error:", error);
        return res.status(500).json({ message: "Failed to fetch faculty members." });
    }
});

app.post("/api/faculty", async (req, res) => {
    try {
        const newFaculty = await Faculty.create(req.body);
        return res.status(201).json(newFaculty);
    } catch (error) {
        console.error("Create faculty error:", error);
        return res.status(400).json({ message: "Failed to create faculty member." });
    }
});

app.put("/api/faculty/:id", async (req, res) => {
    try {
        const updatedFaculty = await Faculty.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updatedFaculty) return res.status(404).json({ message: "Faculty member not found." });
        return res.json(updatedFaculty);
    } catch (error) {
        console.error("Update faculty error:", error);
        return res.status(400).json({ message: "Failed to update faculty member." });
    }
});

app.delete("/api/faculty/:id", async (req, res) => {
    try {
        const deletedFaculty = await Faculty.findByIdAndDelete(req.params.id);
        if (!deletedFaculty) return res.status(404).json({ message: "Faculty member not found." });
        return res.json({ message: "Faculty member deleted successfully." });
    } catch (error) {
        console.error("Delete faculty error:", error);
        return res.status(500).json({ message: "Failed to delete faculty member." });
    }
});

// Room Routes
app.get("/api/rooms", async (req, res) => {
    try {
        const rooms = await Room.find().sort({ name: 1 });
        return res.json(rooms);
    } catch (error) {
        console.error("Get rooms error:", error);
        return res.status(500).json({ message: "Failed to fetch rooms." });
    }
});

app.post("/api/rooms", async (req, res) => {
    try {
        if (Array.isArray(req.body)) {
            const createdRooms = await Room.insertMany(req.body);
            return res.status(201).json(createdRooms);
        }
        const newRoom = await Room.create(req.body);
        return res.status(201).json(newRoom);
    } catch (error) {
        console.error("Create rooms error:", error);
        return res.status(400).json({ message: "Failed to create room(s)." });
    }
});

app.put("/api/rooms/:id", async (req, res) => {
    try {
        const updatedRoom = await Room.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updatedRoom) return res.status(404).json({ message: "Room not found." });
        return res.json(updatedRoom);
    } catch (error) {
        console.error("Update room error:", error);
        return res.status(400).json({ message: "Failed to update room." });
    }
});

app.delete("/api/rooms/:id", async (req, res) => {
    try {
        const deletedRoom = await Room.findByIdAndDelete(req.params.id);
        if (!deletedRoom) return res.status(404).json({ message: "Room not found." });
        return res.json({ message: "Room deleted successfully." });
    } catch (error) {
        console.error("Delete room error:", error);
        return res.status(500).json({ message: "Failed to delete room." });
    }
});

// History Routes
app.get("/api/history", async (req, res) => {
    try {
        const historyLogs = await History.find().sort({ createdAt: -1 });
        return res.json(historyLogs);
    } catch (error) {
        console.error("Get history error:", error);
        return res.status(500).json({ message: "Failed to fetch room history logs." });
    }
});

app.post("/api/history", async (req, res) => {
    try {
        const newLog = await History.create(req.body);
        return res.status(201).json(newLog);
    } catch (error) {
        console.error("Create history error:", error);
        return res.status(400).json({ message: "Failed to create history record." });
    }
});

app.get("/", (req, res) => {
    res.json({
        message: "MERN backend is running!"
    });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});