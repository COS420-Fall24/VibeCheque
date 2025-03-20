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

/**
 * determines whether a role should be removed from a given guild
 * 
 * @param interaction the interaction containing the guild information
 * @param roleName the name of the role being modified
 * @returns a string promise describing the outcome
 */
export async function updateOldRoleInServer(interaction: ChatInputCommandInteraction<CacheType>, roleName: string | undefined): Promise<string>{
    

    // retrieve database info
    // TODO: remove the child() call, and add the path here
    var dbRef = ref(db);

    // attempt to fetch the data associated with `roleName`
    var roleObject = null
    await get(child(dbRef, 'servers/' + interaction.guildId + '/roles/' + roleName)).then((snapshot) => {
        if (snapshot.exists()) {
            roleObject = snapshot.val();
        } else {
            console.log("No data available when getting role");
        }
    }).catch((error) => {
        console.error(error);
    });

    // ensure the role was retrieved properly
    if (roleObject === null){
        return "Role object null";
    }

    // if multiple people have the role, decrement the count
    // if one person has the role, remove it (since they are the function caller)
    // otherwise, no users have the role
    let roleCount = roleObject["count"];
    if (roleCount > 1){
        // decrement the count
        
        await set(ref(db, 'servers/' + interaction.guildId + '/roles/' + roleName), {
            count: roleCount - 1
        })
        return "Decreased role count";
    } else if (roleCount === 1){
        // remove the role
        return removeOldRoleInServer(interaction, roleName);
    } else {
        // no role found!
        return "No role found";
    }
}

/**
 * attempts to remove a role from a given server
 * 
 * @param interaction the interaction containing the guild information
 * @param roleName the name of the role being modified
 * @returns a string promise describing the outcome
 */
export async function removeOldRoleInServer(interaction: ChatInputCommandInteraction<CacheType>, roleName: string | undefined): Promise<string>{
    // if no role is given, exit
    if (roleName === "" || roleName === null || roleName === undefined){
        return "No role specified"
    }

    // if the guild is invalid, exit
    if (!interaction.guild){
        return "No server found";
    }
    
    // remove the role in discord
    interaction.guild.roles.cache.find(role => role.name === roleName)!.delete();

    // remove the role in the db
    await remove(ref(db, 'servers/' + interaction.guildId + '/roles/' + roleName));

    // return successful message
    return "Removed role";
}

/**
 * determines whether a role should be removed from a given guild or simply incremented
 * 
 * @param interaction the interaction containing the guild information
 * @param roleName the name of the role being modified
 * @returns a string promise describing the outcome
 */
export async function updateNewRoleInServer(interaction: ChatInputCommandInteraction<CacheType>, roleName: string | undefined): Promise<string>{
    // if no role is given, exit
    if (roleName === "" || roleName === null || roleName === undefined){
        return "No role specified"
    }

    // retrieve database info
    // TODO: remove the child() call, and add the path here
    var dbRef = ref(db);

    // if the guild is invalid, exit
    if (!interaction.guild){
        return "No server found";
    }
    
    // attempt to access the role data in the db
    var roleObject = null
    await get(child(dbRef, 'servers/' + interaction.guildId + '/roles/' + roleName)).then((snapshot) => {
        if (snapshot.exists()) {
            roleObject = snapshot.val();
        } else {
            console.log("No data available when getting role");
        }
    }).catch((error) => {
        console.error(error);
    });

    // if the role exists, increment it
    // if not, create it
    if (roleObject !== null){
        // increment the role count
        let roleCount = roleObject["count"];
        await set(ref(db, 'servers/' + interaction.guildId + '/roles/' + roleName), {
            count: roleCount + 1 
        })
    } else {
        // register the role with count 1
        await set(ref(db, 'servers/' + interaction.guildId + '/roles/' + roleName), {
            count: 1
        })
    }

    // return a successful message
    return "Updated role count";
}