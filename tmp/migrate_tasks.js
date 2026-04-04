import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const tasksFilePath = path.resolve(__dirname, '../utils/tasks.json');

try {
    const data = fs.readFileSync(tasksFilePath, 'utf8');
    const userTasks = JSON.parse(data);

    for (const userId in userTasks) {
        if (Array.isArray(userTasks[userId])) {
            userTasks[userId].forEach((task, index) => {
                task.number = index + 1;
            });
        }
    }

    fs.writeFileSync(tasksFilePath, JSON.stringify(userTasks, null, 2), 'utf8');
    console.log('Migration successful: All tasks now have a "number" field.');
} catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
}
