// seedFirestore.js
const admin = require('firebase-admin');

// Set environment variable to connect to Firestore Emulator
process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';

// Initialize the Firebase Admin SDK
admin.initializeApp({
    projectId: 'budgie-dc9f6', // Replace with your actual project ID
});

const db = admin.firestore();

const seedFirestore = async () => {
    try {
        const userId = 'hgpHx7zChugsZ2t3Q16TcqqG3ik1';

        // Seed user data in Firestore
        const userRef = db.collection('users').doc(userId);

        await userRef.set({
            interestRate: 3,
            investmentReturnRate: 5,
            targetNestEgg: 100000,
            dateOfBirth: admin.firestore.Timestamp.fromDate(
                new Date(1990, 0, 1)
            ),
        });

        // Seed tableData
        const tableDataRef = userRef.collection('tableData').doc('2025-10-0');
        await tableDataRef.set({
            depositSavings: 1000,
            depositInvestments: 300,
            isActive: true,
            // Add other fields as needed
        });

        // Seed goals
        const goalRef = userRef.collection('goals').doc('goal-1');
        await goalRef.set({
            name: 'Car purchase',
            amount: 10000,
            priority: 1,
        });

        console.log('Firestore seeded successfully.');
    } catch (error) {
        console.error('Error seeding Firestore:', error);
    }
};

seedFirestore();
