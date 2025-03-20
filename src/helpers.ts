import { CacheType, ChatInputCommandInteraction} from "discord.js";
import db from './firebase'; // Import from your firebase.ts file
import { ref, set, get, child, remove }  from "firebase/database";

// TODO: remove db dependancy, use interaction.guild.roles.cache.find(role => role.members.size) to find the number of users with a role
//       maybe only use db to store which roles are moods

/**
 * adds a role to the database under a given guild
 * 
 * @param guildId the ID of the server containing the role
 * @param roleName the name of the role to add to the database
 * @returns a string containing the status of the operation
 */
export async function addRoleToDatabase(guildId: string, roleName: string): Promise<string> {
    // if no role is given, exit
    if (roleName === "" || roleName === null || roleName === undefined){
        return "Invalid role specified";
    }
    
    let rolesReference = ref(db, `servers/${guildId}/roles`);
    
    return await set(child(rolesReference, roleName), true).then((): string => {
        return "role successfully set"
    }).catch((): string => {
        return "something went wrong";
    });
}

/**
 * removes a role from the VC database associated with a given guild
 * 
 * @param guildId the ID of the server containing the role
 * @param roleName the name of the role to add to the database
 * @returns a string containing the status of the operation
 */
export async function removeRoleFromDatabase(guildId: string, roleName: string): Promise<string> {
    // if no role is given, exit
    if (roleName === "" || roleName === null || roleName === undefined){
        return "Invalid role specified";
    }
    
    let rolesReference = ref(db, `servers/${guildId}/roles`);
    
    return await remove(child(rolesReference, roleName)).then((): string => {
        return "role successfully removed"
    }).catch((): string => {
        return "something went wrong";
    });
}