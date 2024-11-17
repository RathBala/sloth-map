// seedFirestore.js
const admin = require('firebase-admin');

// Set environment variables to connect to Emulators
process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9099';

// Initialize the Firebase Admin SDK
admin.initializeApp({
    projectId: 'budgie-dc9f6', // Replace with your actual project ID
});

const db = admin.firestore();
const auth = admin.auth();

const seedFirestore = async () => {
    try {
        // Create test user in Auth Emulator
        const userRecord = await auth.createUser({
            uid: 'test-user-id',
            email: 'testmctesttest@testmcface.com',
            emailVerified: true,
            password: 'booyaWhat5%',
            displayName: 'Test User',
            disabled: false,
        });

        console.log('Test user created:', userRecord.uid);

        // Seed user data in Firestore Emulator
        const userRef = db.collection('users').doc(userRecord.uid);

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
