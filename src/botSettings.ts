import { get, ref, set } from "firebase/database";
import database from "./firebase"; // Import the Realtime Database instance

// Get the current setting for the server (whether the bot is enabled or disabled)
export async function getServerSetting(guildId: string): Promise<string> {
    const dbRef = ref(database, `servers/${guildId}/botStatus`);

    try {
        const snapshot = await get(dbRef);
        if (snapshot.exists()) {
            return snapshot.val(); // Check if the bot is "active"
        } else {
            // Default to "active" if no setting is found
            await set(dbRef, "active");
            return "active";
        }
    } catch (error) {
        console.error("Error getting server setting:", error);
        throw error;
    }
}

// Get the current setting for the server (whether the bot is enabled or disabled)
export async function getUserSetting(userId: string): Promise<string> {
    const dbRef = ref(database, `users/${userId}/dmsStatus`);

    try {
        const snapshot = await get(dbRef);
        if (snapshot.exists()) {
            return snapshot.val();
        } else {
            // Default to "enabled" if no setting is found
            await set(dbRef, "enabled");
            return "enabled";
        }
    } catch (error) {
        console.error("Error getting user setting:", error);
        throw error;
    }
}

// Toggle the bot's enabled/disabled setting for the server
export async function toggleServerSetting(guildId: string): Promise<string> {
    const currentSetting = await getServerSetting(guildId);
    const newSetting = currentSetting ? "inactive" : "active"; // Switch between "active" and "inactive"

    const dbRef = ref(database, `servers/${guildId}/botStatus`);
    await set(dbRef, newSetting);

    return newSetting;
}