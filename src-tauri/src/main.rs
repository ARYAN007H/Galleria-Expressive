// Prevents additional console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    #[cfg(target_os = "linux")]
    {
        // Disables the faulty DMA-BUF renderer typically causing crashes on Nvidia/Linux
        // while safely keeping OpenGL compositing enabled for high performance CSS transforms!
        std::env::set_var("WEBKIT_DISABLE_DMABUF_RENDERER", "1");
    }

    galleria_expressive::run()
}
