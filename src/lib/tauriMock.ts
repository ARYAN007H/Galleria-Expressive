/**
 * Tauri API Mock Layer
 * Provides stub implementations of Tauri APIs when running in a standard browser,
 * enabling UI development and testing without the Tauri runtime.
 */

import type { Photo, Tag, Album, SourceDirectory } from './store'

// Detect if we're running inside Tauri
export const isTauri = typeof window !== 'undefined' && !!(window as any).__TAURI_INTERNALS__

// ── Demo Photo Data ──

function generateDemoPhotos(count: number): Photo[] {
    const folders = ['Vacation', 'Family', 'Nature', 'Architecture', 'Street', 'Portraits', 'Events']
    const cameras = ['Canon EOS R5', 'Sony A7IV', 'Nikon Z9', 'iPhone 15 Pro', 'Pixel 8 Pro']
    const lenses = ['RF 24-70mm f/2.8', 'FE 85mm f/1.4', 'NIKKOR Z 50mm f/1.8', null]

    const photos: Photo[] = []
    for (let i = 1; i <= count; i++) {
        const isWide = Math.random() > 0.4
        const w = isWide ? 1600 : 1080
        const h = isWide ? 1067 : 1440
        const folder = folders[i % folders.length]
        const camera = cameras[i % cameras.length]
        const lens = lenses[i % lenses.length]

        // Generate dates spread across the last 6 months
        const daysAgo = Math.floor(Math.random() * 180)
        const date = new Date()
        date.setDate(date.getDate() - daysAgo)
        date.setHours(Math.floor(Math.random() * 14) + 8)
        date.setMinutes(Math.floor(Math.random() * 60))

        photos.push({
            id: i,
            path: `https://picsum.photos/seed/ifoto${i}/${w}/${h}`,
            filename: `IMG_${String(i).padStart(4, '0')}.jpg`,
            folderRel: folder,
            width: w,
            height: h,
            takenAt: date.toISOString(),
            modifiedAt: date.toISOString(),
            sizeBytes: Math.floor(Math.random() * 8_000_000) + 2_000_000,
            mediaType: i % 15 === 0 ? 'video' : 'photo',
            source: '/demo/photos',
            isFavorite: i % 7 === 0,
            isDeleted: false,
            deletedAt: null,
            cameraMake: camera.split(' ')[0],
            cameraModel: camera,
            lens: lens,
            iso: [100, 200, 400, 800, 1600][Math.floor(Math.random() * 5)],
            shutterSpeed: ['1/125', '1/250', '1/500', '1/1000', '1/2000'][Math.floor(Math.random() * 5)],
            aperture: ['f/1.4', 'f/2.0', 'f/2.8', 'f/4.0', 'f/5.6'][Math.floor(Math.random() * 5)],
            focalLength: ['24mm', '35mm', '50mm', '85mm', '70mm'][Math.floor(Math.random() * 5)],
            gpsLat: 37.7749 + (Math.random() - 0.5) * 10,
            gpsLon: -122.4194 + (Math.random() - 0.5) * 10,
        })
    }
    return photos
}

const demoPhotos = generateDemoPhotos(60)

const demoTags: Tag[] = [
    { id: 1, name: 'Nature', color: '#22c55e' },
    { id: 2, name: 'Travel', color: '#3b82f6' },
    { id: 3, name: 'Family', color: '#ec4899' },
    { id: 4, name: 'Work', color: '#f97316' },
]

const demoAlbums: Album[] = [
    { id: 1, name: 'Summer 2025', createdAt: '2025-08-01T00:00:00Z', photoCount: 24, coverPath: null },
    { id: 2, name: 'Best Shots', createdAt: '2025-06-15T00:00:00Z', photoCount: 12, coverPath: null },
]

const demoLibraries: SourceDirectory[] = [
    { id: 1, name: 'Demo Photos', rootPath: '/demo/photos', photoCount: demoPhotos.length },
]

// ── Mock invoke() ──

type InvokeHandler = (args?: any) => any

const invokeHandlers: Record<string, InvokeHandler> = {
    'restore_session': () => demoLibraries.map(l => ({ id: l.id, rootPath: l.rootPath, name: l.name, photoCount: l.photoCount })),
    'get_all_photos': (args: any) => {
        const { limit = 100, offset = 0 } = args?.params || {}
        return demoPhotos.slice(offset, offset + limit)
    },
    'get_photo_count': () => demoPhotos.length,
    'get_libraries': () => demoLibraries,
    'select_and_index': () => null,
    'get_thumbnail_path': (args: any) => args?.sourcePath || '',
    'toggle_favorite': (args: any) => {
        const photo = demoPhotos.find(p => p.id === args?.photoId)
        if (photo) {
            photo.isFavorite = !photo.isFavorite
            return photo.isFavorite
        }
        return false
    },
    'soft_delete_photos': () => null,
    'restore_photos': () => null,
    'get_tags': () => demoTags,
    'create_tag': (args: any) => ({ id: Date.now(), name: args?.name, color: args?.color || '#0071e3' }),
    'delete_tag': () => null,
    'tag_photos': () => null,
    'untag_photos': () => null,
    'get_photo_tags': () => demoTags.slice(0, 2),
    'get_albums': () => demoAlbums,
    'create_album': (args: any) => ({ id: Date.now(), name: args?.name, createdAt: new Date().toISOString(), photoCount: 0, coverPath: null }),
    'delete_album': () => null,
    'rename_album': () => null,
    'add_to_album': () => null,
    'remove_from_album': () => null,
    'get_album_photos': () => demoPhotos.slice(0, 12),
    'search_photos': (args: any) => {
        const q = (args?.query || '').toLowerCase()
        return demoPhotos.filter(p => p.filename.toLowerCase().includes(q) || p.folderRel.toLowerCase().includes(q))
    },
}

export async function mockInvoke<T>(cmd: string, args?: any): Promise<T> {
    const handler = invokeHandlers[cmd]
    if (handler) {
        // Simulate async delay
        await new Promise(r => setTimeout(r, 80))
        return handler(args) as T
    }
    console.warn(`[TauriMock] Unhandled invoke: "${cmd}"`, args)
    return null as T
}

export function mockConvertFileSrc(path: string): string {
    // In browser mode, if path is already an HTTP URL, return as-is
    if (path.startsWith('http://') || path.startsWith('https://')) {
        return path
    }
    // For local paths, return a placeholder
    const seed = path.replace(/[^a-zA-Z0-9]/g, '').slice(-8) || 'default'
    return `https://picsum.photos/seed/${seed}/800/600`
}

export async function mockOpen(_options?: any): Promise<string | null> {
    // Simulate folder selection
    return '/demo/photos'
}

export async function mockMessage(msg: string, _options?: any): Promise<void> {
    console.log(`[TauriMock Dialog] ${msg}`)
    alert(msg)
}
