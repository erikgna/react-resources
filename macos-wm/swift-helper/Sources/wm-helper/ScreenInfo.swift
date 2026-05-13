import Cocoa

struct ScreenData: Codable {
    let x: CGFloat
    let y: CGFloat
    let width: CGFloat
    let height: CGFloat
    let isPrimary: Bool
}

struct ScreenInfoResult: Codable {
    let screens: [ScreenData]
    let focusedPid: Int32
}

func getScreenInfo() -> ScreenInfoResult {
    let focusedPid = NSWorkspace.shared.frontmostApplication?.processIdentifier ?? 0

    let primaryScreen = NSScreen.screens.first
    let primaryHeight = primaryScreen?.frame.height ?? 0

    let screens = NSScreen.screens.map { screen -> ScreenData in
        let frame = screen.frame
        // Flip Y: NSScreen uses bottom-left origin, AXUIElement uses top-left
        let axY = primaryHeight - frame.origin.y - frame.height
        return ScreenData(
            x: frame.origin.x,
            y: axY,
            width: frame.width,
            height: frame.height,
            isPrimary: screen == primaryScreen
        )
    }

    return ScreenInfoResult(screens: screens, focusedPid: focusedPid)
}
