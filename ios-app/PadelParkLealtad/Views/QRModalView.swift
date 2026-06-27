import SwiftUI

struct QRModalView: View {
    let member: Member
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        ZStack {
            Color.navyInk.ignoresSafeArea()

            VStack(spacing: 0) {
                // Close
                HStack {
                    Spacer()
                    Button { dismiss() } label: {
                        Image(systemName: "xmark.circle.fill")
                            .font(.system(size: 28))
                            .foregroundColor(.white.opacity(0.35))
                    }
                }
                .padding(.horizontal, 24)
                .padding(.top, 24)

                Spacer()

                VStack(spacing: 18) {
                    // QR
                    QRCodeView(payload: member.qrPayload, size: 220)
                        .padding(16)
                        .background(Color.white)
                        .cornerRadius(16)

                    // ID
                    Text(member.id)
                        .font(.system(size: 20, weight: .semibold, design: .monospaced))
                        .foregroundColor(.lime)

                    // Name
                    Text(member.name.uppercased())
                        .font(.custom("BebasNeue-Regular", size: 30))
                        .foregroundColor(.white)
                        .lineLimit(1)
                        .minimumScaleFactor(0.6)
                        .padding(.horizontal, 24)
                }

                Spacer()

                Text("Presenta este código en recepción")
                    .font(.system(size: 13))
                    .foregroundColor(.white.opacity(0.35))
                    .padding(.bottom, 48)
            }
        }
    }
}
