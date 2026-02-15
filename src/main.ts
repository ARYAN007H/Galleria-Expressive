import './app.css'
import App from './App.svelte'

window.addEventListener('error', (event) => {
    document.body.innerHTML = `<div style="color:red; padding:20px; font-family: monospace;"><h1>Error</h1><pre>${event.message}\n${event.filename}:${event.lineno}</pre></div>`;
    console.error(event.error);
});

window.addEventListener('unhandledrejection', (event) => {
    document.body.innerHTML = `<div style="color:red; padding:20px; font-family: monospace;"><h1>Promise Rejection</h1><pre>${event.reason}</pre></div>`;
    console.error(event.reason);
});

const app = new App({
    target: document.getElementById('app') as HTMLElement,
})

export default app
