import SwiftUI

struct CardView: View {
    @EnvironmentObject var state: AppState
    @State private var showQR    = false
    @State private var saveState: SaveState = .idle

    enum SaveState { case idle, saving, done, failed }

    var member: Member { state.member! }

    var body: some View {
        ScrollView(showsIndicators: false) {
            VStack(alignment: .leading, spacing: 20) {
                // Greeting
                VStack(alignment: .leading, spacing: 2) {
                    Text("Hola, \(member.name.components(separatedBy: " ").first ?? "Socio")")
                        .font(.system(size: 13))
                        .foregroundColor(.white.opacity(0.5))
                    Text("TARJETA DE SOCIO")
                        .font(.custom("BebasNeue-Regular", size: 26))
                        .foregroundColor(.white)
                }
                .padding(.horizontal, 24)
                .padding(.top, 20)

                // Card
                LoyaltyCardView(member: member)
                    .padding(.horizontal, 18)

                // Notice
                HStack(alignment: .top, spacing: 12) {
                    Image(systemName: "shield.checkered")
                        .font(.system(size: 17))
                        .foregroundColor(.lime)
                        .padding(.top, 1)
                    Text("Tu tarjeta no se guarda en la nube. Descarga tu pase y guárdalo en Fotos — lo necesitarás presentar en recepción cada vez que visites el club.")
                        .font(.system(size: 12))
                        .foregroundColor(.white.opacity(0.65))
                }
                .padding(14)
                .background(Color.navy.opacity(0.55))
                .cornerRadius(12)
                .padding(.horizontal, 24)

                // Actions
                VStack(spacing: 11) {
                    Button { saveCard() } label: {
                        HStack(spacing: 8) {
                            Image(systemName: saveState == .done ? "checkmark" : "arrow.down.to.line")
                            Text(saveState == .done ? "¡Guardado en Fotos!" : "Descargar pase")
                        }
                        .font(.system(size: 16, weight: .semibold))
                        .foregroundColor(.navyInk)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 15)
                        .background(Color.lime)
                        .cornerRadius(13)
                    }
                    .disabled(saveState == .saving)

                    Button { showQR = true } label: {
                        HStack(spacing: 8) {
                            Image(systemName: "qrcode")
                            Text("Ver código QR")
                        }
                        .font(.system(size: 16, weight: .medium))
                        .foregroundColor(.white)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 15)
                        .background(Color.navy)
                        .cornerRadius(13)
                    }

                    if saveState == .failed {
                        Text("No se pudo guardar. Permite acceso en Ajustes > Privacidad > Fotos.")
                            .font(.system(size: 12))
                            .foregroundColor(Color(red: 1, green: 0.4, blue: 0.4))
                            .multilineTextAlignment(.center)
                    }
                }
                .padding(.horizontal, 24)
                .padding(.bottom, 100)
            }
        }
        .sheet(isPresented: $showQR) {
            QRModalView(member: member)
        }
    }

    private func saveCard() {
        saveState = .saving
        CardExporter.save(member: member) { ok in
            saveState = ok ? .done : .failed
            if ok {
                DispatchQueue.main.asyncAfter(deadline: .now() + 3) {
                    saveState = .idle
                }
            }
        }
    }
}
