import express from 'express';
import dotenv from 'dotenv';
import connectDb from './lib/database.js';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/authRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import cors from 'cors';

import path from "path";

import {app,server} from "./lib/socket.js"
dotenv.config();



const __dirname = path.resolve();
// Middleware
app.use(express.json({ limit: "10mb" }));  // Increase payload size limit
app.use(express.urlencoded({ limit: "10mb", extended: true }));
app.use(cookieParser());
app.use(cors({
    origin: "http://localhost:5173",
    credentials: true
}));

// Connect to DB
connectDb();

// Routes
app.use("/api/auth", authRoutes);
app.use('/api/messages', messageRoutes);

if(process.env.NODE_ENV ==="production"){
    app.use(express.static(path.join(__dirname,"../frontend/dist")));


    app.get("*",(req,res)=>{
        res.sendFile(path.join(__dirname,"../frontend","dist","index.html"));
    })
}

// Start Server
const PORT = process.env.PORT || 6001;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
