import { defineConfig } from 'cypress';
import { devServer } from '@cypress/vite-dev-server';
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
                        exec(
                            `node "${seedScriptPath}"`,
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

            on('dev-server:start', (options) => {
                return devServer({
                    framework: 'react',
                    viteConfig: {
                        configFile: path.resolve(__dirname, 'vite.config.js'),
                        mode: 'test',
                    },
                });
            });

            return config;
        },
        env: {
            VITE_USE_FIREBASE_EMULATORS: 'true',
        },
    },
});
