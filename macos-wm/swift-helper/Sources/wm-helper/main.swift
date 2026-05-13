import Foundation
import ApplicationServices

struct Request: Decodable {
    let action: String
    let pid: Int32?
    let frame: FrameInput?
}

struct FrameInput: Decodable {
    let x: Double
    let y: Double
    let width: Double
    let height: Double
}

struct Response<T: Encodable>: Encodable {
    let success: Bool
    let data: T?
    let error: String?
}

struct EmptyData: Encodable {}

func respond<T: Encodable>(success: Bool, data: T?, error: String?) {
    let response = Response(success: success, data: data, error: error)
    let encoder = JSONEncoder()
    if let json = try? encoder.encode(response),
       let str = String(data: json, encoding: .utf8) {
        print(str)
    }
}

guard let inputData = FileHandle.standardInput.readDataToEndOfFile() as Data?,
      !inputData.isEmpty else {
    respond(success: false, data: EmptyData?.none, error: "No input")
    exit(1)
}

guard let request = try? JSONDecoder().decode(Request.self, from: inputData) else {
    respond(success: false, data: EmptyData?.none, error: "Invalid JSON input")
    exit(1)
}

switch request.action {
case "checkAccessibility":
    struct AccessResult: Encodable { let trusted: Bool }
    // prompt: true → macOS shows the permission dialog if not trusted
    let opts = [kAXTrustedCheckOptionPrompt.takeUnretainedValue() as String: true] as CFDictionary
    let trusted = AXIsProcessTrustedWithOptions(opts)
    respond(success: true, data: AccessResult(trusted: trusted), error: nil)

case "getScreenInfo":
    let info = getScreenInfo()
    respond(success: true, data: info, error: nil)

case "moveWindow":
    guard let pid = request.pid, let f = request.frame else {
        respond(success: false, data: EmptyData?.none, error: "Missing pid or frame")
        exit(1)
    }
    do {
        let frame = CGRect(x: f.x, y: f.y, width: f.width, height: f.height)
        try moveWindow(pid: pid, frame: frame)
        respond(success: true, data: EmptyData?.none, error: nil)
    } catch {
        respond(success: false, data: EmptyData?.none, error: error.localizedDescription)
    }

default:
    respond(success: false, data: EmptyData?.none, error: "Unknown action: \(request.action)")
    exit(1)
}
