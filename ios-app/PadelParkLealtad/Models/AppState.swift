import Foundation
import Combine

class AppState: ObservableObject {
    enum Screen { case welcome, form, generating, main }
    enum Tab    { case card, rewards, profile }

    @Published var screen: Screen = .welcome
    @Published var tab: Tab = .card
    @Published var member: Member? = nil
    @Published var qrOpen = false

    private let storageKey = "pp_gj_member_v1"

    init() {
        if let data = UserDefaults.standard.data(forKey: storageKey),
           let saved = try? JSONDecoder().decode(Member.self, from: data) {
            member = saved
            screen = .main
        }
    }

    func save(_ m: Member) {
        member = m
        if let data = try? JSONEncoder().encode(m) {
            UserDefaults.standard.set(data, forKey: storageKey)
        }
    }

    func reset() {
        UserDefaults.standard.removeObject(forKey: storageKey)
        member = nil
        screen = .welcome
        tab = .card
    }
}
