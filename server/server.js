const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const crypto = require("crypto");
require("dotenv").config();
const Staff = require("./models/Staff");

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

app.get("/", (req, res) => {
    res.json({
        message: "MERN backend is running!"
    });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});