import { App, PluginSettingTab, Setting } from 'obsidian';
import Todoian from 'main';

export class TodoianSettingsTab extends PluginSettingTab {
    plugin: Todoian;

    constructor(app: App, plugin: Todoian) {
        super(app, plugin);
        this.plugin = plugin;
    }

    // für Darstellung der Settings
    display(): void {
        this.containerEl.empty();

        new Setting(this.containerEl)
            .setName('Todoist API Token')
            .setDesc('Enter your API Token generated by Todoist')
            .addText((text) => (
                // callback
                text
                    .setPlaceholder('Enter your Todoist API Token')
                    .setValue(this.plugin.settings.todoistApiToken)
                    .onChange(async (value) => {
                        this.plugin.settings.todoistApiToken = value;
                        await this.plugin.saveSettings();
                    })
            ));
    }
}