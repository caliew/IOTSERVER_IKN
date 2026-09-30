const mongoose = require('mongoose');
const config = require('config');
const db = config.get('mongoURI');

const connectDB = async () => {
  try {
    await mongoose.connect(db, {
      useNewUrlParser: true,
      useCreateIndex: true,
      useFindAndModify: false,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 2000
    });
    console.log('[DB.JS] MongoDB Connected');
  } catch (err) {
    console.warn('[DB.JS] MongoDB connection skipped/failed:', err.message);
  }
};

module.exports = connectDB;
