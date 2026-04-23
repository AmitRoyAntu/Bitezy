require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Models
const { User, Buyer, Seller, Admin } = require('../models/User');
const Provider = require('../models/Provider');
const MenuItem = require('../models/MenuItem');
const Review = require('../models/Review');
const Order = require('../models/Order');
const connectDB = require('../config/db')

const loadJSON = (filename) => {
    const data = fs.readFileSync(path.join(__dirname, '../../data', `${filename}.json`), 'utf-8');
    return JSON.parse(data);
};

const seedData = async () => {
    try {
        
        connectDB(process.env.MONGODB_URI)
            .then(() => {
                console.log("Database connected successfully");
            })
            .catch((err) => {
                console.error(`Database connection error: ${err.message}`);
                process.exit(1);
            });

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
        
        const createdUsers = await Promise.all(usersData.map(async (u) => {
            const { id, password, ...rest } = u;
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password || 'password123', salt);
            const userData = { ...rest, password: hashedPassword };

            if (userData.role === 'seller') {
                return await Seller.create(userData);
            } else if (userData.role === 'buyer') {
                return await Buyer.create(userData);
            } else if (userData.role === 'admin') {
                return await Admin.create(userData);
            } else {
                return await User.create(userData); // Fallback
            }
        }));
        
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

        // 6. Recalculate and persist provider ratings from seeded reviews
        await Provider.updateMany({}, { rating: 0 });

        const ratingStats = await Review.aggregate([
            {
                $group: {
                    _id: '$provider',
                    avgRating: { $avg: '$rating' }
                }
            }
        ]);

        if (ratingStats.length > 0) {
            const ratingUpdates = ratingStats.map(stat => ({
                updateOne: {
                    filter: { _id: stat._id },
                    update: { rating: Number(stat.avgRating.toFixed(1)) }
                }
            }));

            await Provider.bulkWrite(ratingUpdates);
        }
        console.log('Updated provider ratings from reviews.');

        console.log('Seeding completed successfully!');
        process.exit();
    } catch (err) {
        console.error('Error during seeding:', err);
        process.exit(1);
    }
};

seedData();
