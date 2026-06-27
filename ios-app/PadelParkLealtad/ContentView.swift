import SwiftUI

struct ContentView: View {
    @StateObject private var state = AppState()

    var body: some View {
        ZStack {
            switch state.screen {
            case .welcome:    WelcomeView()
            case .form:       RegisterView()
            case .generating: GeneratingView()
            case .main:       MainView()
            }
        }
        .environmentObject(state)
        .preferredColorScheme(.dark)
        .animation(.easeInOut(duration: 0.25), value: state.screen)
    }
}
