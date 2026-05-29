import Foundation

struct Member: Codable, Equatable {
    var id: String
    var name: String
    var email: String
    var phone: String
    var birth: String
    var level: String
    var joinedAt: Date

    static func generateId(name: String, email: String) -> String {
        var hash: UInt32 = 2166136261
        let seed = "\(name)|\(email)|\(Date().timeIntervalSince1970)"
        for byte in seed.utf8 {
            hash ^= UInt32(byte)
            hash = hash &* 16777619
        }
        let part = (hash % 9000) + 1000
        let yr = Calendar.current.component(.year, from: Date()) % 100
        return String(format: "PP-%02d-%04d", yr, part)
    }

    var qrPayload: String {
        "PPGJ|\(id)|\(name)"
    }

    var joinedFormatted: String {
        let f = DateFormatter()
        f.locale = Locale(identifier: "es_MX")
        f.dateFormat = "MMM yy"
        return f.string(from: joinedAt).uppercased()
    }

    var initials: String {
        name.split(separator: " ").prefix(2).compactMap { $0.first }.map { String($0) }.joined().uppercased()
    }
}
