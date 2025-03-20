import { CacheType, ChatInputCommandInteraction, Client, FetchMembersOptions, Guild, Role, Snowflake} from "discord.js";
import db from './firebase'; // Import from your firebase.ts file
import { ref, set, get, child, remove }  from "firebase/database";

// the minimum amount of time a mood can be in a server before it gets deleted automatically
export const MINIMUM_MOOD_LIFESPAN: number = 3 * (1000 * 60);

/**
 * extracts the timestamp field of discord's Snowflake structure
 * 
 * https://discord.com/developers/docs/reference#snowflakes
 * 
 * @param snowflake the snowflake to extract the timestamp from
 * @returns the timestamp of the snowflake
 */
export function getTimestampFromSnowflake(snowflake: Snowflake): number {
    return (parseInt(snowflake) >> 22) + 1420070400000;
}

/**
 * adds a role to the database under a given guild
 * 
 * @param guildId the ID of the server containing the role
 * @param roleName the name of the role to add to the database
 * @returns a string containing the status of the operation
 */
export async function addRoleToDatabase(guildId: string, role: Role): Promise<string> {
    // if no role is given, exit
    if (!role){
        return "Invalid role specified";
    }
    
    let rolesReference = ref(db, `servers/${guildId}/roles`);
    
    return await set(child(rolesReference, role.name), role.id).then((): string => {
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
export async function removeRoleFromDatabase(guildId: string, role: Role): Promise<string> {
    // if no role is given, exit
    if (!role){
        return "Invalid role specified";
    }
    
    let rolesReference = ref(db, `servers/${guildId}/roles`);
    
    return await remove(child(rolesReference, role.name)).then((): string => {
        return "role successfully removed"
    }).catch((): string => {
        return "something went wrong";
    });
}

/**
 * removes a role from the VC database associated with a given guild
 * 
 * @param guildId the ID of the server to clean
 * @returns a string containing the status of the operation
 */
export async function cleanupRoles(client: Client, guildId: string): Promise<string> {
    let guild = await client.guilds.fetch(guildId);
    // if no role is given, exit
    if (guild){
    
        let rolesReference = ref(db, `servers/${guildId}/roles`);
        
        let snapshot = await get(rolesReference);

        snapshot.forEach((roleSnapshot) => {
            let roleSnowflake: Snowflake = roleSnapshot.val();

            let timeDifference = Date.now() - getTimestampFromSnowflake(roleSnowflake);

            if (timeDifference >= MINIMUM_MOOD_LIFESPAN) {
                guild.roles.fetch(roleSnowflake, {cache: false, force: true}).then(role => {
                    if (!role) return;

                    guild.members.fetch().then(members => {
                        if (!members.some(member => member.roles.cache.some(memberRole => memberRole.id === roleSnowflake))) {
                            console.log(`removing role ${roleSnowflake} (${roleSnapshot.key})`);
                            role.delete("Role out of use");
                            removeRoleFromDatabase(guildId, role);
                        }
                    });
                });
            }
        });

        return "all unused roles removed";
    } else {
        return "Bot does not have access to the specified guild";
    }
}