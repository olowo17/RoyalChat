import mongoose, { ConnectOptions } from "mongoose";

// initialize mongoose and connect to db
const connectDb = async () => {
    try {
        if (!process.env.MONGO_URI) {
            throw new Error("MONGO_URI is not defined in environment variables.");
        }

        // connect to mongodb 🎉
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log('connected to database')

        // Check if the connection is successful
        conn.connection.once("open", () => {
            console.log("Connected to MongoDB", conn.connection.host);
        });

        // Check for connection errors
        conn.connection.on("error", (err) => {
            console.error("MongoDB connection error:", err);
        });
    } catch (err) {
        console.error(err);
    }
};

export default connectDb;
