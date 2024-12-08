import { CacheType, ChatInputCommandInteraction} from "discord.js";
import db from './firebase'; // Import from your firebase.ts file
import { ref, set, get, child, remove, DatabaseReference, DataSnapshot }  from "firebase/database";

export async function updateOldRoleInServer(interaction: ChatInputCommandInteraction<CacheType>, roleName: string | undefined): Promise<string>{

    if (roleName === "" || roleName === null || roleName === undefined){
        return "No role specified"
    }

    var dbRef = ref(db);
    if (!interaction.guild){
        return "No server found";
    } else {
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

        if (roleObject !== null){
            let roleCount = roleObject["count"];
            if (roleCount > 1){
                await set(ref(db, 'servers/' + interaction.guildId + '/roles/' + roleName), {
                    count: roleCount - 1 
                })
                return "Decreased role count";
            } else if (roleCount === 1){
                return removeOldRoleInServer(interaction, roleName);
            } else {
                return "No role found";
            }
        } else {
            return "Role object null";
        }

    }
}

export async function removeOldRoleInServer(interaction: ChatInputCommandInteraction<CacheType>, roleName: string | undefined): Promise<string>{

    if (roleName === "" || roleName === null || roleName === undefined){
        return "No role specified"
    }

    if (!interaction.guild){
        return "No server found";
    } else {
        interaction.guild.roles.cache.find(role => role.name === roleName)!.delete();
        await remove(ref(db, 'servers/' + interaction.guildId + '/roles/' + roleName));
        return "Removed role";
    }
}

export async function updateNewRoleInServer(interaction: ChatInputCommandInteraction<CacheType>, roleName: string | undefined): Promise<string>{

    if (roleName === "" || roleName === null || roleName === undefined){
        return "No role specified"
    }

    var dbRef = ref(db);
    if (!interaction.guild){
        return "No server found";
    } else {
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

        if (roleObject !== null){
            let roleCount = roleObject["count"];
            await set(ref(db, 'servers/' + interaction.guildId + '/roles/' + roleName), {
                count: roleCount + 1 
            })
        } else {
            await set(ref(db, 'servers/' + interaction.guildId + '/roles/' + roleName), {
                count: 1
            })
        }
        return "Updated role count";

    }


}