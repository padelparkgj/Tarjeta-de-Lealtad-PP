import Foundation

struct APIService {
    private static let url = URL(string: "https://script.google.com/macros/s/AKfycbwhc3OOGuHj0QPzvjUqwINDEWzQLwfpD54pm-vtVDGj_L4OTHgpW6_g6JwJJ1w2zTi5yg/exec")!

    static func register(member: Member) {
        var comps = URLComponents()
        comps.queryItems = [
            .init(name: "action", value: "register"),
            .init(name: "id",     value: member.id),
            .init(name: "name",   value: member.name),
            .init(name: "email",  value: member.email),
            .init(name: "phone",  value: member.phone),
            .init(name: "birth",  value: member.birth),
            .init(name: "level",  value: member.level),
        ]
        var req = URLRequest(url: url)
        req.httpMethod = "POST"
        req.httpBody = comps.query?.data(using: .utf8)
        req.setValue("application/x-www-form-urlencoded", forHTTPHeaderField: "Content-Type")
        URLSession.shared.dataTask(with: req).resume()
    }
}
