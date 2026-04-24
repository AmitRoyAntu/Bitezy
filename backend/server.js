const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const errorHandler = require("./middleware/errorHandler");

const PORT = process.env.PORT;

// Database connection
connectDB(process.env.MONGODB_URI)
    .then(() => {
        console.log("Database connected successfully");
    })
    .catch((err) => {
        console.error(`Database connection error: ${err.message}`);
        process.exit(1);
    });

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/providers', require('./routes/providerRoutes'));
app.use('/api/menu', require('./routes/menuRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/reviews', require('./routes/reviewRoutes'));
app.use('/api/users', require('./routes/userRoutes'));

app.get('/', (req, res) => {
    res.send('Bitezy API is running...');
});

// Error handling
app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`Server is running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});