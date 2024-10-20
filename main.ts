import { Plugin, requestUrl } from 'obsidian'
import { TodoianPluginSettings, DEFAULT_SETTINGS } from 'src/settings';
import { TodoianSettingsTab } from 'src/settings-tab';
// import { TodoistApi } from '@doist/todoist-api-typescript';
// -> using API instead of SDK since API can be used with requestUrl (solves CORS issue)

export default class Todoian extends Plugin {
	settings: TodoianPluginSettings;
	statusBarTextElement: HTMLSpanElement;

	async onload(): Promise<void> {
		await this.loadSettings();
		this.addSettingTab(new TodoianSettingsTab(this.app, this));

		this.fetchTasks();

		this.addCommand({
			id: 'insert-todoist-tasks',
			name: 'Todoian: Insert filtered Todoist tasks',
			editorCallback: async (editor, view) => {
				const tasks = await this.fetchTasks();
				if (tasks) {
					const cursor = editor.getCursor();
					const checkableTasks = tasks.map((task) => '- [ ] ' + task)
					editor.replaceRange(checkableTasks.join('\n'), cursor);
				}
			}
		});
	}

	async fetchTasks(): Promise<string[] | null> {
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
				const tasks: { content: string }[] = resp.json;
				const taskContent = tasks.map((task: { content: string }) => task.content);
				console.log(taskContent);
				return taskContent;
			} else {
				console.log("Error fetching the Todoist tasks -", resp.status);
				return null;
			}
		} catch (error) {
			console.log("Token:", this.settings.todoistApiToken);
			console.log("Error fetching the Todoist tasks:", error);
			return null;
		}
	}

	async loadSettings(): Promise<void> {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings(): Promide<void> {
		await this.saveData(this.settings);
	}
}