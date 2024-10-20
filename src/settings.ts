export interface TodoianPluginSettings {
    todoistApiToken: string;
    todoistFilter: string;
}

export const DEFAULT_SETTINGS: TodoianPluginSettings = {
    todoistApiToken: '',
    todoistFilter: 'p1 & today',
};