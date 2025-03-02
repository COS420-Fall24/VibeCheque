import { describe, it, beforeEach, expect } from '@jest/globals';
import fs from 'fs';
import path from 'path';
import { ServerConfigManager } from './serverConfigManager';

describe('ServerConfigManager', () => {
    const TEST_CONFIG_PATH = './test-server-configs.json';
    let serverConfigManager: ServerConfigManager;
    
    beforeEach(() => {
        // Clean up test file before each test
        if (fs.existsSync(TEST_CONFIG_PATH)) {
            fs.unlinkSync(TEST_CONFIG_PATH);
        }

        // Stop console.log output from flooding tests
        jest.spyOn(console, "log").mockImplementation(() => {});

        serverConfigManager = new ServerConfigManager(TEST_CONFIG_PATH);
    });

    it('should successfully toggle server status from enabled to disabled', () => {
        const guildId = '123456789';
        const userId = '987654321';
        
        // Verify initial state is enabled
        expect(serverConfigManager.isServerEnabled(guildId)).toBe(true);
        
        // Toggle to disabled
        const config = serverConfigManager.toggleServerStatus(guildId, userId);
        
        // Verify the toggle
        expect(config.isEnabled).toBe(false);
        expect(config.toggledBy).toBe(userId);
        expect(config.lastToggled).not.toBeNull();
        
        // Verify the state persisted
        expect(serverConfigManager.isServerEnabled(guildId)).toBe(false);
    });

    it('should toggle server status multiple times successfully', () => {
        const guildId = '123456789';
        const userId = '987654321';
        
        // First toggle (true -> false)
        let config = serverConfigManager.toggleServerStatus(guildId, userId);
        expect(config.isEnabled).toBe(false);
        
        // Second toggle (false -> true)
        config = serverConfigManager.toggleServerStatus(guildId, userId);
        expect(config.isEnabled).toBe(true);
        
        // Third toggle (true -> false)
        config = serverConfigManager.toggleServerStatus(guildId, userId);
        expect(config.isEnabled).toBe(false);
    });

    it('should persist server status between instance recreations', () => {
        const guildId = '123456789';
        const userId = '987654321';
        
        // Toggle with first instance
        serverConfigManager.toggleServerStatus(guildId, userId);
        expect(serverConfigManager.isServerEnabled(guildId)).toBe(false);
        
        // Create new instance and verify state persisted
        const newServerConfigManager = new ServerConfigManager(TEST_CONFIG_PATH);
        expect(newServerConfigManager.isServerEnabled(guildId)).toBe(false);
    });
});