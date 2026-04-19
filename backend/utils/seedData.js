require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Models
const User = require('../models/User');
const Provider = require('../models/Provider');
const MenuItem = require('../models/MenuItem');
const Review = require('../models/Review');
const Order = require('../models/Order');

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB Connected for seeding...');
    } catch (err) {
        console.error(err.message);
        process.exit(1);
    }
};

const loadJSON = (filename) => {
    const data = fs.readFileSync(path.join(__dirname, '../../data', `${filename}.json`), 'utf-8');
    return JSON.parse(data);
};

const seedData = async () => {
    try {
        await connectDB();

        // Clear existing data
        await User.deleteMany();
        await Provider.deleteMany();
        await MenuItem.deleteMany();
        await Review.deleteMany();
        await Order.deleteMany();

        console.log('Cleared existing data.');

        const usersData = loadJSON('users').users;
        const userMap = {}; // Map old integer ID to new MongoDB ObjectId
        const bcrypt = require('bcryptjs');
        
        const preparedUsers = await Promise.all(usersData.map(async (u) => {
            const { id, password, ...rest } = u;
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password || 'password123', salt);
            return {
                ...rest,
                password: hashedPassword
            };
        }));
        
        const createdUsers = await User.create(preparedUsers);
        
        usersData.forEach((u, index) => {
            userMap[u.id] = createdUsers[index]._id;
        });
        console.log(`Seeded ${createdUsers.length} users (passwords hashed).`);


        // 2. Seed Providers
        const providersData = loadJSON('providers').providers;
        const providerMap = {};
        
        const createdProviders = await Provider.create(providersData.map(p => {
            const { id, seller, ...rest } = p;
            return {
                ...rest,
                seller: userMap[seller] || new mongoose.Types.ObjectId()
            };
        }));
        
        providersData.forEach((p, index) => {
            providerMap[p.id] = createdProviders[index]._id;
        });
        console.log(`Seeded ${createdProviders.length} providers.`);

        // 3. Seed Menu Items
        const menuData = loadJSON('menu').menu;
        const menuMap = {};
        
        const createdMenuItems = await MenuItem.create(menuData.map(m => {
            const { id, provider, ...rest } = m;
            return {
                ...rest,
                provider: providerMap[provider]
            };
        }));
        
        menuData.forEach((m, index) => {
            menuMap[m.id] = createdMenuItems[index]._id;
        });
        console.log(`Seeded ${createdMenuItems.length} menu items.`);

        // 4. Seed Reviews
        const reviewsData = loadJSON('reviews').reviews;
        await Review.create(reviewsData.map(r => {
            const { provider, buyer, ...rest } = r;
            return {
                ...rest,
                provider: providerMap[provider],
                buyer: userMap[buyer]
            };
        }));
        console.log(`Seeded ${reviewsData.length} reviews.`);

        // 5. Seed Orders
        const ordersData = loadJSON('orders').orders;
        await Order.create(ordersData.map(o => {
            const { id, customer, provider, items, ...rest } = o;
            return {
                ...rest,
                customer: userMap[customer],
                provider: providerMap[provider],
                items: items.map(item => ({
                    ...item,
                    menuItem: menuMap[item.menuItem]
                }))
            };
        }));
        console.log(`Seeded ${ordersData.length} orders.`);

        console.log('Seeding completed successfully!');
        process.exit();
    } catch (err) {
        console.error('Error during seeding:', err);
        process.exit(1);
    }
};

seedData();
