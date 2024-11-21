import { defineConfig } from 'cypress';
import { exec } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
    projectId: 's45wyu',
    e2e: {
        baseUrl: 'http://localhost:5173',
        setupNodeEvents(on, config) {
            on('task', {
                seedFirestore() {
                    return new Promise((resolve, reject) => {
                        const seedScriptPath = path.resolve(
                            __dirname,
                            'src',
                            'utils',
                            'seedFirestore.cjs'
                        );

                        // Pass environment variables to the child process
                        const env = {
                            ...process.env,
                            FIRESTORE_EMULATOR_HOST: 'localhost:8080',
                            FIREBASE_AUTH_EMULATOR_HOST: 'localhost:9099',
                        };

                        exec(
                            `node "${seedScriptPath}"`,
                            { env },
                            (err, stdout, stderr) => {
                                if (err) {
                                    console.error(
                                        `Error seeding Firestore: ${stderr}`
                                    );
                                    return reject(err);
                                }
                                console.log(stdout);
                                resolve(stdout);
                            }
                        );
                    });
                },
            });

            return config;
        },
    },
});
