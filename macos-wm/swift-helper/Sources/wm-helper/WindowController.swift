import Cocoa
import ApplicationServices

enum WindowError: Error, CustomStringConvertible {
    case noFocusedWindow
    case axError(AXError)
    case invalidValue

    var description: String {
        switch self {
        case .noFocusedWindow: return "No focused window found"
        case .axError(let err): return "AXError code \(err.rawValue)"
        case .invalidValue: return "Could not create AX value"
        }
    }
}

func moveWindow(pid: pid_t, frame: CGRect) throws {
    let appRef = AXUIElementCreateApplication(pid)

    var windowRef: CFTypeRef?
    let windowResult = AXUIElementCopyAttributeValue(appRef, kAXFocusedWindowAttribute as CFString, &windowRef)
    guard windowResult == .success, let window = windowRef else {
        throw WindowError.axError(windowResult == .success ? .failure : windowResult)
    }

    let axWindow = window as! AXUIElement

    // Set position first, then size (prevents layout shift on some apps)
    var position = frame.origin
    guard let posValue = AXValueCreate(.cgPoint, &position) else {
        throw WindowError.invalidValue
    }
    let posResult = AXUIElementSetAttributeValue(axWindow, kAXPositionAttribute as CFString, posValue)
    if posResult != .success {
        throw WindowError.axError(posResult)
    }

    var size = frame.size
    guard let sizeValue = AXValueCreate(.cgSize, &size) else {
        throw WindowError.invalidValue
    }
    let sizeResult = AXUIElementSetAttributeValue(axWindow, kAXSizeAttribute as CFString, sizeValue)
    if sizeResult != .success {
        throw WindowError.axError(sizeResult)
    }
}
