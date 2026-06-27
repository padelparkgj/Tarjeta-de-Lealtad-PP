import SwiftUI

struct LoyaltyCardView: View {
    let member: Member

    var body: some View {
        ZStack {
            LinearGradient(
                colors: [Color.navy, Color.navyDeep],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )

            // Decorative blobs
            Circle()
                .fill(Color.lime.opacity(0.07))
                .frame(width: 240, height: 240)
                .offset(x: 90, y: -70)

            Circle()
                .fill(Color.lime.opacity(0.04))
                .frame(width: 140, height: 140)
                .offset(x: -60, y: 70)

            VStack(alignment: .leading, spacing: 0) {
                // Header row
                HStack(alignment: .top) {
                    VStack(alignment: .leading, spacing: 2) {
                        Text("PADEL PARK")
                            .font(.custom("BebasNeue-Regular", size: 17))
                            .foregroundColor(.white)
                            .kerning(1.5)
                        Text("Gran Jardín")
                            .font(.system(size: 9))
                            .foregroundColor(.white.opacity(0.45))
                    }
                    Spacer()
                    ZStack {
                        Circle()
                            .fill(Color.lime)
                            .frame(width: 30, height: 30)
                        Text("PP")
                            .font(.custom("BebasNeue-Regular", size: 13))
                            .foregroundColor(.navyInk)
                    }
                }

                Spacer()

                // Name + QR row
                HStack(alignment: .bottom, spacing: 12) {
                    VStack(alignment: .leading, spacing: 5) {
                        Text(member.name.uppercased())
                            .font(.custom("BebasNeue-Regular", size: 26))
                            .foregroundColor(.white)
                            .lineLimit(1)
                            .minimumScaleFactor(0.55)

                        HStack(spacing: 6) {
                            Text(member.level)
                                .font(.system(size: 9, weight: .semibold))
                                .foregroundColor(.navyInk)
                                .padding(.horizontal, 7)
                                .padding(.vertical, 3)
                                .background(Color.lime)
                                .cornerRadius(4)
                            Text(member.joinedFormatted)
                                .font(.system(size: 9))
                                .foregroundColor(.white.opacity(0.4))
                        }
                    }
                    Spacer()
                    QRCodeView(payload: member.qrPayload, size: 58)
                        .padding(4)
                        .background(Color.white)
                        .cornerRadius(6)
                }

                Spacer().frame(height: 10)

                Text(member.id)
                    .font(.system(size: 11, weight: .medium, design: .monospaced))
                    .foregroundColor(.lime)
            }
            .padding(18)
        }
        .frame(height: 195)
        .cornerRadius(18)
        .shadow(color: .black.opacity(0.45), radius: 22, x: 0, y: 12)
    }
}
