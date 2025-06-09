const app = require("./src/app");
const mongoose = require("mongoose");

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    app.listen(process.env.PORT || 5000, () =>
      console.log("🚀 Server running on port " + process.env.PORT)
    );
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
  });