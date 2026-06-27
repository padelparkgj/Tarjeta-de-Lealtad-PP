import SwiftUI

struct ProfileView: View {
    @EnvironmentObject var state: AppState
    @State private var confirmDelete = false

    var member: Member { state.member! }

    var body: some View {
        ScrollView(showsIndicators: false) {
            VStack(spacing: 24) {
                // Avatar
                VStack(spacing: 10) {
                    ZStack {
                        Circle()
                            .fill(
                                LinearGradient(
                                    colors: [Color.navy, Color.navyDeep],
                                    startPoint: .topLeading,
                                    endPoint: .bottomTrailing
                                )
                            )
                            .frame(width: 76, height: 76)
                            .overlay(
                                Circle().stroke(Color.lime.opacity(0.4), lineWidth: 2)
                            )
                        Text(member.initials)
                            .font(.custom("BebasNeue-Regular", size: 28))
                            .foregroundColor(.white)
                    }
                    Text(member.name)
                        .font(.custom("BebasNeue-Regular", size: 26))
                        .foregroundColor(.white)
                    Text(member.level)
                        .font(.system(size: 11, weight: .semibold))
                        .foregroundColor(.navyInk)
                        .padding(.horizontal, 12)
                        .padding(.vertical, 5)
                        .background(Color.lime)
                        .cornerRadius(999)
                }
                .padding(.top, 20)

                // Info card
                VStack(spacing: 1) {
                    InfoRow(icon: "creditcard.fill",  label: "ID de socio",  value: member.id)
                    InfoRow(icon: "envelope.fill",    label: "Correo",       value: member.email)
                    InfoRow(icon: "phone.fill",       label: "Teléfono",     value: member.phone)
                    if !member.birth.isEmpty {
                        InfoRow(icon: "birthday.cake.fill", label: "Nacimiento", value: member.birth)
                    }
                    InfoRow(icon: "calendar",         label: "Socio desde",  value: member.joinedFormatted)
                }
                .cornerRadius(14)
                .clipped()

                // Delete
                Button { confirmDelete = true } label: {
                    HStack(spacing: 8) {
                        Image(systemName: "trash")
                        Text("Eliminar tarjeta")
                    }
                    .font(.system(size: 15, weight: .medium))
                    .foregroundColor(Color(red: 1, green: 0.38, blue: 0.38))
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 14)
                    .background(Color(red: 1, green: 0.38, blue: 0.38).opacity(0.1))
                    .cornerRadius(13)
                }

                Text("Padel Park Gran Jardín · León, Gto")
                    .font(.system(size: 11))
                    .foregroundColor(.white.opacity(0.25))
                    .padding(.bottom, 100)
            }
            .padding(.horizontal, 24)
        }
        .confirmationDialog(
            "¿Eliminar tu tarjeta?",
            isPresented: $confirmDelete,
            titleVisibility: .visible
        ) {
            Button("Eliminar", role: .destructive) { state.reset() }
            Button("Cancelar", role: .cancel) {}
        } message: {
            Text("Tendrás que volver a crear tu tarjeta de socio.")
        }
    }
}

private struct InfoRow: View {
    let icon: String
    let label: String
    let value: String

    var body: some View {
        HStack(spacing: 14) {
            Image(systemName: icon)
                .font(.system(size: 13))
                .foregroundColor(.lime)
                .frame(width: 20)
            VStack(alignment: .leading, spacing: 2) {
                Text(label)
                    .font(.system(size: 10))
                    .foregroundColor(.white.opacity(0.38))
                Text(value)
                    .font(.system(size: 14))
                    .foregroundColor(.white)
            }
            Spacer()
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 12)
        .background(Color.navy.opacity(0.4))
    }
}
