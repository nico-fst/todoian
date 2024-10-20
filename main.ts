import { Plugin, requestUrl } from 'obsidian'
import { TodoianPluginSettings, DEFAULT_SETTINGS } from 'src/settings';
import { TodoianSettingsTab } from 'src/settings-tab';
// import { TodoistApi } from '@doist/todoist-api-typescript';
// -> using API instead of SDK since API can be used with requestUrl (solves CORS issue)

export default class Todoian extends Plugin {
	settings: TodoianPluginSettings;
	statusBarTextElement: HTMLSpanElement;

	async onload() {
		await this.loadSettings();
		this.addSettingTab(new TodoianSettingsTab(this.app, this));

		const headers = {
			"Authorization": `Bearer ${this.settings.todoistApiToken}`
		}
		const encFilter = encodeURIComponent(this.settings.todoistFilter);

		try {
			const resp = await requestUrl({
				url: `https://api.todoist.com/rest/v2/tasks?filter=${encFilter}`,
				headers
			});
			if (resp.status === 200) {
				console.log(resp.json);
			}
		} catch (error) {
			console.log("Token:", this.settings.todoistApiToken);
			console.log("Error fetching the Todoist tasks:", error);
		}

		this.statusBarTextElement = this.addStatusBarItem().createEl('span');
		this.readActiveFileAndUpdateLineCount();

		// wait since plugings loaded before file:
		this.app.workspace.on('active-leaf-change', async () => {
			this.readActiveFileAndUpdateLineCount();
		})
		
		this.app.workspace.on('editor-change', editor => {
			const content = editor.getDoc().getValue();
			this.updateLineCount(content);
		})
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	private updateLineCount(fileContent?: string) {
		const count = fileContent ? fileContent.split(/\r\n|\r|\n/).length : 0;
		const linesWord = count === 1 ? "line" : "lines";
		this.statusBarTextElement.textContent = `${count} ${linesWord}`;

	}

	private async readActiveFileAndUpdateLineCount() {
		const file = this.app.workspace.getActiveFile();
		if (file) {
			const content = await this.app.vault.read(file);
			this.updateLineCount(content);
		} else {
			this.updateLineCount(undefined);
		}
	}
}