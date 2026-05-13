// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "wm-helper",
    platforms: [.macOS(.v13)],
    targets: [
        .executableTarget(
            name: "wm-helper",
            path: "Sources/wm-helper"
        )
    ]
)
