const TOKEN_PATTERN = /\{\{(\w+)\}\}/g;

export const EMAIL_FROM = 'EmpowHER Festival <noreply@empowheratx.com>';

export function escapeHtml(text: string): string {
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

export function renderTemplate(template: string, replacements: Record<string, string>): string {
    return template.replace(TOKEN_PATTERN, (_, token: string) => replacements[token] ?? '');
}
