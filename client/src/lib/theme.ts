export function toggleTheme() {
    if (typeof document === 'undefined') return;
    const isDark = document.documentElement.classList.toggle('dark');
    localStorage.theme = isDark ? 'dark' : 'light';
}
