import Conf from 'conf';
import crypto from 'crypto';
import { homedir } from 'os';
import os from 'os';

function deriveKey(hostname) {
    const components = [
        homedir(),
        process.platform,
        process.arch,
        hostname,
    ];
    const seed = components.join('|');
    const hash = crypto.createHash('sha256').update(seed).digest();
    return hash.toString('base64');
}

const hostnames = [
    'unknown',
    'Kutti4thson',
    '',
    'localhost',
    undefined,
    'Kutti4thson.local',
    'Kutti4thson.lan'
];

for (const h of hostnames) {
    const key = deriveKey(h === undefined ? 'unknown' : h);
    console.log(`Trying hostname: "${h}" -> Key: ${key.substring(0, 5)}...`);
    try {
        const store = new Conf({
            projectName: 'echo-cli',
            encryptionKey: key
        });
        // If we get here without error, check if it actually has data
        const val = store.get('defaultProvider');
        if (val) {
          console.log(`  🎉 SUCCESS! Default provider: ${val}`);
          process.exit(0);
        } else {
          console.log(`  ○ Loaded but empty.`);
        }
    } catch (e) {
        // console.log(`  FAILED: ${e.message}`);
    }
}
console.log('No working key found.');
