fn main() {
    println!("cargo:rustc-check-cfg=cfg(has_payload)");
    let payload = std::path::Path::new("sidecar_payload.tar.gz");
    if payload.exists() {
        println!("cargo:rustc-cfg=has_payload");
        if let Ok(abs) = payload.canonicalize() {
            println!("cargo:rustc-env=SIDECAR_PAYLOAD_PATH={}", abs.display());
        } else {
            println!("cargo:rustc-env=SIDECAR_PAYLOAD_PATH={}", payload.display());
        }
        println!("cargo:rerun-if-changed=sidecar_payload.tar.gz");
    }

    // Tauri's bundle.externalBin configuration expects the sidecar binary to exist
    // at build/check time. When running cargo check, clippy, or CI without a full
    // sidecar build (via scripts/build-sidecar.mjs), provide a placeholder so
    // tauri-build does not fail.
    if let Ok(target_triple) = std::env::var("TARGET") {
        let ext = if target_triple.contains("windows") {
            ".exe"
        } else {
            ""
        };
        let binary_path = format!("binaries/glassbeetle-api-{target_triple}{ext}");
        let binary = std::path::Path::new(&binary_path);
        if !binary.exists() {
            if let Some(parent) = binary.parent() {
                let _ = std::fs::create_dir_all(parent);
            }
            let _ = std::fs::write(binary, b"");
        }
    }

    tauri_build::build()
}
