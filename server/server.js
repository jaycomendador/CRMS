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
const Message = require("./models/Message");
const { sendInstructorEmail } = require("./utils/mailer");

const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST", "PATCH", "PUT", "DELETE"]
    }
});

io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);

    socket.on("join_department", (dept) => {
        if (dept) {
            const roomName = `dept_${dept.toLowerCase().trim()}`;
            socket.join(roomName);
            console.log(`Socket ${socket.id} joined ${roomName}`);
        }
    });

    socket.on("join_faculty", (facultyId) => {
        if (facultyId) {
            const roomName = `faculty_${facultyId}`;
            socket.join(roomName);
            console.log(`Socket ${socket.id} joined ${roomName}`);
        }
    });

    socket.on("disconnect", () => {
        console.log("Socket disconnected:", socket.id);
    });
});

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

app.post("/api/faculty/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        const normalizedEmail = email?.trim().toLowerCase();

        if (!normalizedEmail || !password) {
            return res.status(400).json({ message: "Enter your faculty email and password." });
        }

        const faculty = await Faculty.findOne({ email: normalizedEmail }).select("+passwordHash");
        if (!faculty) {
            return res.status(401).json({ message: "No faculty account found with this email." });
        }

        if (faculty.status === "Inactive") {
            return res.status(403).json({ message: "Your faculty account is currently inactive." });
        }

        if (faculty.passwordHash) {
            const isMatch = await passwordsMatch(password, faculty.passwordHash);
            if (!isMatch) {
                return res.status(401).json({ message: "Invalid email or password." });
            }
        } else {
            // First time login for existing faculty record — set initial password to what was provided
            faculty.passwordHash = await hashPassword(password);
            await faculty.save();
        }

        return res.json({
            message: "Faculty signed in successfully.",
            faculty: {
                _id: faculty._id,
                id: faculty._id,
                name: faculty.name,
                email: faculty.email,
                department: faculty.department,
                role: faculty.role,
                assignedBuilding: faculty.assignedBuilding,
                assignedRoom: faculty.assignedRoom,
                phone: faculty.phone,
                status: faculty.status
            }
        });
    } catch (error) {
        console.error("Faculty login error:", error);
        return res.status(500).json({ message: "Unable to sign in: " + error.message });
    }
});

app.post("/api/faculty", async (req, res) => {
    try {
        const { name, email, department, role, assignedBuilding, assignedRoom, phone, status, password } = req.body;
        if (!name || !email) {
            return res.status(400).json({ message: "Faculty name and email are required." });
        }

        const normalizedEmail = email.trim().toLowerCase();
        const existing = await Faculty.findOne({ email: normalizedEmail });
        if (existing) {
            return res.status(409).json({ message: "A faculty member with this email already exists." });
        }

        const initialPassword = password || "faculty123";
        const passwordHash = await hashPassword(initialPassword);

        const newFaculty = await Faculty.create({
            name: name.trim(),
            email: normalizedEmail,
            department: department || "Computer Science",
            role: role || "Professor",
            assignedBuilding: assignedBuilding || "Main Campus",
            assignedRoom: assignedRoom || "",
            phone: phone || "",
            status: status || "Active",
            passwordHash
        });

        return res.status(201).json(newFaculty);
    } catch (error) {
        console.error("Create faculty error:", error);
        return res.status(400).json({ message: "Failed to create faculty member: " + error.message });
    }
});

app.put("/api/faculty/:id", async (req, res) => {
    try {
        const updateData = { ...req.body };
        if (updateData.password) {
            updateData.passwordHash = await hashPassword(updateData.password);
            delete updateData.password;
        }
        const updatedFaculty = await Faculty.findByIdAndUpdate(req.params.id, updateData, { new: true });
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

// Email Messaging Route
app.post("/api/messages/send-email", async (req, res) => {
    try {
        const { to, instructorName, senderName, senderEmail, subject, message, room } = req.body;

        if (!to || !message) {
            return res.status(400).json({ message: "Recipient email and message text are required." });
        }

        const result = await sendInstructorEmail({
            to,
            instructorName,
            senderName,
            senderEmail,
            subject,
            message,
            room
        });

        return res.json({
            message: "Email sent to instructor successfully.",
            result
        });
    } catch (error) {
        console.error("Send email error:", error);
        return res.status(500).json({ message: "Failed to send email to instructor: " + error.message });
    }
});

// Department-Scoped Chat Routes (faculty see only their department's messages)
app.get("/api/messages/department/:department", async (req, res) => {
    try {
        const dept = decodeURIComponent(req.params.department);
        const deptRegex = new RegExp(`^${dept.trim()}$`, "i");
        const facultyInDept = await Faculty.find({ department: deptRegex });
        const facultyIds = facultyInDept.map((f) => f._id.toString());

        const messages = await Message.find({
            $or: [
                { department: deptRegex },
                { facultyId: { $in: facultyIds } }
            ]
        }).sort({ createdAt: 1 });
        return res.json(messages);
    } catch (error) {
        console.error("Fetch dept messages error:", error);
        return res.status(500).json({ message: "Failed to fetch department messages: " + error.message });
    }
});

app.post("/api/messages/department/:department", async (req, res) => {
    try {
        const dept = decodeURIComponent(req.params.department);
        const { facultyId, sender, senderName, senderEmail, text, room } = req.body;

        if (!text || !sender) {
            return res.status(400).json({ message: "Sender and text are required." });
        }

        let assignedFacultyId = facultyId || "";
        if (!assignedFacultyId && senderEmail) {
            const fac = await Faculty.findOne({ email: senderEmail.trim().toLowerCase() });
            if (fac) assignedFacultyId = fac._id.toString();
        }

        const newMsg = await Message.create({
            facultyId: assignedFacultyId,
            department: dept,
            sender,
            senderName: senderName || (sender === "admin" ? "Campus Administrator" : "Faculty Member"),
            senderEmail: senderEmail || "",
            text,
            room: room || "",
            emailDispatched: false,
            readByAdmin: sender === "admin",
            readByFaculty: sender === "faculty"
        });

        const roomName = `dept_${dept.toLowerCase().trim()}`;
        io.to(roomName).emit("new_message", newMsg);
        if (assignedFacultyId) {
            io.to(`faculty_${assignedFacultyId}`).emit("new_message", newMsg);
        }
        io.emit("new_message", newMsg);

        return res.status(201).json(newMsg);
    } catch (error) {
        console.error("Create dept message error:", error);
        return res.status(500).json({ message: "Failed to create message: " + error.message });
    }
});

app.patch("/api/messages/department/:department/read", async (req, res) => {
    try {
        const dept = decodeURIComponent(req.params.department);
        const { reader } = req.body;
        const update = reader === "faculty" ? { readByFaculty: true } : { readByAdmin: true };
        const deptRegex = new RegExp(`^${dept.trim()}$`, "i");
        await Message.updateMany({ department: deptRegex }, { $set: update });
        return res.json({ success: true });
    } catch (error) {
        console.error("Mark dept read error:", error);
        return res.status(500).json({ message: "Failed to mark messages as read" });
    }
});

// Two-Way Messages Route between Admin & Faculty
app.get("/api/messages/faculty/:facultyId", async (req, res) => {
    try {
        const { facultyId } = req.params;
        let dept = "";
        if (mongoose.Types.ObjectId.isValid(facultyId)) {
            const faculty = await Faculty.findById(facultyId);
            if (faculty) dept = faculty.department;
        }

        const queryConditions = [{ facultyId }];
        if (dept) {
            queryConditions.push({ department: new RegExp(`^${dept.trim()}$`, "i") });
        }

        const messages = await Message.find({ $or: queryConditions }).sort({ createdAt: 1 });
        return res.json(messages);
    } catch (error) {
        console.error("Fetch messages error:", error);
        return res.status(500).json({ message: "Failed to fetch messages: " + error.message });
    }
});

app.post("/api/messages/faculty/:facultyId", async (req, res) => {
    try {
        const { facultyId } = req.params;
        const { sender, senderName, senderEmail, text, room, shouldSendEmail } = req.body;

        if (!text || !sender) {
            return res.status(400).json({ message: "Sender and text are required." });
        }

        let deptName = req.body.department || "";
        let targetEmail = req.body.emailRecipient;
        let targetName = req.body.recipientName || "Instructor";

        if (mongoose.Types.ObjectId.isValid(facultyId)) {
            const faculty = await Faculty.findById(facultyId);
            if (faculty) {
                if (!deptName) deptName = faculty.department;
                if (!targetEmail) targetEmail = faculty.email;
                if (!targetName || targetName === "Instructor") targetName = faculty.name;
            }
        }

        let emailDispatched = false;
        let emailRecipient = "";
        let emailPreviewUrl = "";

        // If admin sent message and requested email dispatch
        if (sender === "admin" && shouldSendEmail !== false) {
            if (targetEmail) {
                try {
                    const mailRes = await sendInstructorEmail({
                        to: targetEmail,
                        instructorName: targetName,
                        senderName: senderName || "Campus Administrator",
                        senderEmail: senderEmail || "admin@crms.local",
                        subject: `[CRMS] New message from Campus Staff regarding ${room || "Campus Facility"}`,
                        message: text,
                        room
                    });
                    emailDispatched = true;
                    emailRecipient = targetEmail;
                    emailPreviewUrl = mailRes.previewUrl || "";
                } catch (emailErr) {
                    console.error("Email dispatch in message post failed:", emailErr.message);
                }
            }
        }

        const newMsg = await Message.create({
            facultyId,
            department: deptName || "Computer Science",
            sender,
            senderName: senderName || (sender === "admin" ? "Campus Administrator" : "Faculty Member"),
            senderEmail: senderEmail || "",
            text,
            room: room || "",
            emailDispatched,
            emailRecipient,
            emailPreviewUrl,
            readByAdmin: sender === "admin",
            readByFaculty: sender === "faculty"
        });

        io.to(`faculty_${facultyId}`).emit("new_message", newMsg);
        if (newMsg.department) {
            io.to(`dept_${newMsg.department.toLowerCase().trim()}`).emit("new_message", newMsg);
        }
        io.emit("new_message", newMsg);

        return res.status(201).json(newMsg);
    } catch (error) {
        console.error("Create message error:", error);
        return res.status(500).json({ message: "Failed to create message: " + error.message });
    }
});

app.patch("/api/messages/faculty/:facultyId/read", async (req, res) => {
    try {
        const { facultyId } = req.params;
        const { reader } = req.body; // 'admin' or 'faculty'

        const update = reader === "faculty" ? { readByFaculty: true } : { readByAdmin: true };
        await Message.updateMany({ facultyId }, { $set: update });
        return res.json({ success: true });
    } catch (error) {
        console.error("Mark read error:", error);
        return res.status(500).json({ message: "Failed to mark messages as read" });
    }
});

app.get("/", (req, res) => {
    res.json({
        message: "MERN backend is running!"
    });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT} with Socket.io real-time engine`);
});