
import fs from 'fs';
import path from 'path';

interface ServerConfig {
    isEnabled: boolean;
    lastToggled: string | null;
    toggledBy: string | null;
}

class ServerConfigManager {
    private configPath: string;
    private serverStates: Map<string, ServerConfig>;

    constructor(configPath: string = './res/server-configs.json') {
        this.configPath = path.resolve(configPath);
        this.serverStates = new Map();
        
        // Load initial states from file if it exists
        try {
            if (fs.existsSync(this.configPath)) {
                const savedConfigs = JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
                for (const [guildId, config] of Object.entries(savedConfigs)) {
                    this.serverStates.set(guildId, config as ServerConfig);
                }
                console.log('[ServerConfigManager] Loaded existing configurations');
            }
        } catch (error) {
            console.error('[ServerConfigManager] Error loading initial config:', error);
        }
    }

    private saveToFile(): void {
        try {
            const configObject = Object.fromEntries(this.serverStates);
            fs.writeFileSync(this.configPath, JSON.stringify(configObject, null, 2));
            console.log('[ServerConfigManager] Saved configurations to file');
        } catch (error) {
            console.error('[ServerConfigManager] Error saving to file:', error);
        }
    }

    public toggleServerStatus(guildId: string, userId: string): ServerConfig {
        console.log(`[ServerConfigManager] Attempting to toggle server ${guildId}`);
        
        // Get current state or create default
        let currentConfig = this.serverStates.get(guildId) || {
            isEnabled: true,
            lastToggled: null,
            toggledBy: null
        };

        // Log before state
        console.log('[ServerConfigManager] Before toggle:', currentConfig);

        // Create new config object with toggled state
        const newConfig: ServerConfig = {
            isEnabled: !currentConfig.isEnabled,
            lastToggled: new Date().toISOString(),
            toggledBy: userId
        };

        // Update in-memory state
        this.serverStates.set(guildId, newConfig);

        // Log after state
        console.log('[ServerConfigManager] After toggle:', newConfig);

        // Save to file as backup
        this.saveToFile();

        return newConfig;
    }

    public isServerEnabled(guildId: string): boolean {
        // If no state is stored, default to enabled
        const state = this.serverStates.get(guildId);
        if (!state) {
            return true;
        }
        return state.isEnabled;
    }

    public getServerConfig(guildId: string): ServerConfig {
        const config = this.serverStates.get(guildId);
        if (!config) {
            const defaultConfig: ServerConfig = {
                isEnabled: true,
                lastToggled: null,
                toggledBy: null
            };
            this.serverStates.set(guildId, defaultConfig);
            return defaultConfig;
        }
        return config;
    }
}
export { ServerConfigManager };
export default new ServerConfigManager();