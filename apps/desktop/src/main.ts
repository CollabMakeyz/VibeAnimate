import { h, render } from 'preact';
import { Editor } from './ui/editor.js';
import { ErrorBoundary } from './ui/error-boundary.js';
import { reportError } from './platform/native.js';
window.addEventListener('error', event => reportError(event.error));
window.addEventListener('unhandledrejection', event => reportError(event.reason));
const root = document.getElementById('app');
if (!root)
    throw new Error('Application root is missing');
root.replaceChildren();
render(h(ErrorBoundary, null, h(Editor, null)), root);
