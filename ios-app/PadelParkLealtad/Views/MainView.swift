import SwiftUI

struct MainView: View {
    @EnvironmentObject var state: AppState

    var body: some View {
        ZStack(alignment: .bottom) {
            Color.navyInk.ignoresSafeArea()

            Group {
                switch state.tab {
                case .card:    CardView()
                case .rewards: RewardsView()
                case .profile: ProfileView()
                }
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)

            PPTabBar()
        }
        .ignoresSafeArea(.keyboard)
    }
}

struct PPTabBar: View {
    @EnvironmentObject var state: AppState

    var body: some View {
        HStack(spacing: 0) {
            PPTabItem(icon: "creditcard.fill",  label: "Tarjeta",   tab: .card)
            PPTabItem(icon: "gift.fill",         label: "Beneficios", tab: .rewards)
            PPTabItem(icon: "person.fill",       label: "Perfil",    tab: .profile)
        }
        .padding(.top, 10)
        .padding(.bottom, 28)
        .background(.ultraThinMaterial)
        .overlay(
            Rectangle()
                .frame(height: 0.5)
                .foregroundColor(Color.lime.opacity(0.18)),
            alignment: .top
        )
    }
}

struct PPTabItem: View {
    @EnvironmentObject var state: AppState
    let icon: String
    let label: String
    let tab: AppState.Tab

    var active: Bool { state.tab == tab }

    var body: some View {
        Button { state.tab = tab } label: {
            VStack(spacing: 4) {
                Image(systemName: icon)
                    .font(.system(size: 21))
                Text(label)
                    .font(.system(size: 10, weight: .medium))
            }
            .foregroundColor(active ? .lime : .white.opacity(0.35))
            .frame(maxWidth: .infinity)
        }
        .buttonStyle(.plain)
    }
}
