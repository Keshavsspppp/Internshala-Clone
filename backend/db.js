const mongoose = require("mongoose");
require('dotenv').config();
const database = process.env.DATABASE_URL;
module.exports.connect = async () => {
    if (!database) throw new Error("DATABASE_URL is required");
    await mongoose.connect(database, { serverSelectionTimeoutMS: 10000 });
    console.log("Database is connected");
};
