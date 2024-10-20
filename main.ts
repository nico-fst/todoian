import { MarkdownPostProcessorContext, Plugin, requestUrl } from 'obsidian'
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
			id: 'todoian-insert-todoist-tasks',
			name: 'Todoian: Insert filtered Todoist tasks',
			editorCallback: async (editor, view) => {
				const tasks = await this.fetchTasks();
				if (tasks) {
					const cursor = editor.getCursor();
					editor.replaceRange(this.toCheckable(tasks).join('\n'), cursor);
				}
			}
		});

		this.addCommand({
			id: 'todoian-insert-todoist-widget',
			name: 'Todoian: Insert Todoist tasks widget',
			editorCallback: async (editor, view) => {
				editor.replaceSelection('```todoian-tasks\n```\n');
			}
		})

		this.registerMarkdownPostProcessor((el: HTMLElement, ctx: MarkdownPostProcessorContext) => {
			const codeBlock = el.querySelector('code');
			if (codeBlock && codeBlock.textContent?.trim() === 'todoian-tasks') {
				this.createTaskWidget(el);
			}
		})
	}

	async createTaskWidget(el: HTMLElement): Promise<void> {
		const tasks = await this.fetchTasks();
		if (tasks) {
			const container = document.createElement('div');
			tasks.forEach((task) => {
				const checkbox = document.createElement('input');
				checkbox.type = 'checkbox';

				const label = document.createElement('label');
				label.textContent = task;
				label.style.marginLeft = '8px';

				const taskContainer = document.createElement('div');
				taskContainer.appendChild(checkbox);
				taskContainer.appendChild(label);
				container.appendChild(taskContainer);
			});
			el.innerHTML = '';
			el.appendChild(container);
		} else {
			el.textContent = 'Error fetching tasks :(';
		}

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

	toCheckable(tasks: string[]): string[] {
		return tasks.map((task) => '- [ ] ' + task);
	}

	async loadSettings(): Promise<void> {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings(): Promise<void> {
		await this.saveData(this.settings);
	}
}