import { getCurrentWindow } from '@tauri-apps/api/window';

export async function startDrag() {
    await getCurrentWindow().startDragging();
}
