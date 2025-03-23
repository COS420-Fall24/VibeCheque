import { CacheType, ChatInputCommandInteraction, Client, FetchMembersOptions, Guild, Role, Snowflake} from "discord.js";
import db from './firebase'; // Import from your firebase.ts file
import { ref, set, get, child, remove } from "firebase/database";

// the minimum amount of time a mood can be in a server before it gets deleted automatically
export const MINIMUM_MOOD_LIFESPAN: number = 0.5 * (1000 * 60);

/**
 * extracts the timestamp field of discord's Snowflake structure
 * 
 * https://discord.com/developers/docs/reference#snowflakes
 * 
 * @param snowflake the snowflake to extract the timestamp from
 * @returns the timestamp of the snowflake
 */
export function getTimestampFromSnowflake(snowflake: Snowflake): number {
    return Number((BigInt(snowflake) >> 22n) + 1420070400000n);
}

/**
 * fills the timestamp field of discord's Snowflake structure
 * 
 * https://discord.com/developers/docs/reference#snowflakes
 * 
 * @param timestamp the unix timestamp of the snowflake
 * @returns the new snowflake
 */
export function timestampToSnowflake(timestamp: number): string {
    return (BigInt(timestamp - 1420070400000) << 22n).toString();
}

/**
 * adds a role to the database under a given guild
 * 
 * @param guildId the ID of the server containing the role
 * @param roleName the name of the role to add to the database
 * @returns a string containing the status of the operation
 */
export async function addRoleToDatabase(guildId: string, role: Role): Promise<string> {
    let rolesReference = ref(db);
    
    return await set(child(rolesReference, `servers/${guildId}/roles/${role.name}`), role.id).then((): string => {
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
    let rolesReference = ref(db);
    
    return await remove(child(rolesReference, `servers/${guildId}/roles/${role.name}`)).then((): string => {
        return "role successfully removed"
    }).catch((): string => {
        return "something went wrong";
    });
}

/**
 * removes a role from the VC database and guild if it is unused
 * 
 * @param guildId the ID of the server containing the role
 * @param roleName the name of the role to add to the database
 * @returns a string containing the status of the operation
 */
export async function removeRoleIfUnused(role: Role | null): Promise<string> {
    // if no role is given, exit
    if (!role){
        return "Invalid role specified";
    }
    
    let timeDifference = Date.now() - getTimestampFromSnowflake(role.id);

    if (timeDifference < MINIMUM_MOOD_LIFESPAN) {
        return "role is too young to be removed"
    }
    
    
    return await role.guild.members.fetch().then((members): string => {
        // console.log(members);
        if (members.some(member => member.roles.cache.some(memberRole => memberRole.id === role.id))) {
            return "role still in use"
        }

        console.log(`removing role ${role.id} (${role.name})`);
        role.delete("Role out of use");
        removeRoleFromDatabase(role.guild.id, role);
        return "role removed"
    });
}

/**
 * removes all unused moods
 * 
 * @param guildId the ID of the server to clean
 * @returns a string containing the status of the operation
 */
export async function cleanupMoods(client: Client, guildId: string): Promise<string> {
    let guild = await client.guilds.fetch(guildId);
    // if no role is given, exit
    if (guild){
    
        let rolesReference = ref(db, `servers/${guildId}/roles`);
        
        let snapshot = await get(rolesReference);

        snapshot.forEach((roleSnapshot) => {
            let roleSnowflake: Snowflake = roleSnapshot.val();

            guild.roles.fetch(roleSnowflake).then(removeRoleIfUnused);
        });

        return "all unused roles removed";
    } else {
        return "Bot does not have access to the specified guild";
    }
}