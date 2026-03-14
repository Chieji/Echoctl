import Conf from 'conf';
import crypto from 'crypto';
import { homedir } from 'os';
import os from 'os';

function deriveKey(hostname) {
    const components = [
        homedir(),
        process.platform,
        process.arch,
        hostname || 'unknown',
    ];
    const seed = components.join('|');
    const hash = crypto.createHash('sha256').update(seed).digest();
    return hash.toString('base64');
}

const keys = [
    { name: 'process.env.HOSTNAME (undefined -> unknown)', key: deriveKey(process.env.HOSTNAME) },
    { name: 'os.hostname() (Kutti4thson)', key: deriveKey(os.hostname()) }
];

for (const k of keys) {
    console.log(`Trying key: ${k.name}`);
    try {
        const store = new Conf({
            projectName: 'echo-cli',
            encryptionKey: k.key
        });
        console.log(`  SUCCESS! Config loaded. Default provider: ${store.get('defaultProvider')}`);
    } catch (e) {
        console.log(`  FAILED: ${e.message}`);
    }
}
