import SwiftUI

struct WelcomeView: View {
    @EnvironmentObject var state: AppState

    private let perks: [(icon: String, label: String)] = [
        ("bolt.fill",         "Precio Silver cada 3 visitas"),
        ("gift.fill",         "Visita gratis cada 6 visitas"),
        ("trophy.fill",       "Torneos y clínicas con descuento"),
        ("birthday.cake.fill","Sorpresas en tu cumpleaños"),
    ]

    var body: some View {
        ZStack {
            LinearGradient(
                colors: [Color.navyInk, Color.navy],
                startPoint: .top, endPoint: .bottom
            ).ignoresSafeArea()

            VStack(spacing: 0) {
                // Logo
                VStack(spacing: 6) {
                    HStack(spacing: 6) {
                        Circle()
                            .fill(Color.lime)
                            .frame(width: 9, height: 9)
                        Text("PADEL PARK")
                            .font(.custom("BebasNeue-Regular", size: 22))
                            .foregroundColor(.white)
                            .kerning(2)
                    }
                    Text("Gran Jardín · León, Gto")
                        .font(.system(size: 12))
                        .foregroundColor(.white.opacity(0.45))
                }
                .padding(.top, 64)

                Spacer()

                // Hero text
                VStack(spacing: 10) {
                    Text("TU TARJETA\nDE LEALTAD")
                        .font(.custom("BebasNeue-Regular", size: 54))
                        .foregroundColor(.white)
                        .multilineTextAlignment(.center)
                        .lineSpacing(2)

                    Text("Acumula visitas y desbloquea beneficios\nexclusivos en el club.")
                        .font(.system(size: 14))
                        .foregroundColor(.white.opacity(0.55))
                        .multilineTextAlignment(.center)
                }

                Spacer()

                // Perks
                VStack(alignment: .leading, spacing: 14) {
                    ForEach(perks, id: \.icon) { perk in
                        HStack(spacing: 14) {
                            Image(systemName: perk.icon)
                                .font(.system(size: 15))
                                .foregroundColor(.lime)
                                .frame(width: 24)
                            Text(perk.label)
                                .font(.system(size: 14))
                                .foregroundColor(.white.opacity(0.8))
                            Spacer()
                        }
                    }
                }
                .padding(.horizontal, 32)

                Spacer()

                // CTA
                Button {
                    state.screen = .form
                } label: {
                    Text("Crea tu tarjeta")
                        .font(.system(size: 17, weight: .semibold))
                        .foregroundColor(.navyInk)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 16)
                        .background(Color.lime)
                        .cornerRadius(14)
                }
                .padding(.horizontal, 24)

                // Footer
                VStack(spacing: 4) {
                    Link(destination: URL(string: "https://www.instagram.com/padel_park_granjardin")!) {
                        HStack(spacing: 5) {
                            Image(systemName: "camera.fill")
                                .font(.system(size: 12))
                            Text("@padel_park_granjardin")
                                .font(.system(size: 12))
                        }
                        .foregroundColor(.white.opacity(0.35))
                    }
                }
                .padding(.top, 16)
                .padding(.bottom, 36)
            }
        }
    }
}
