import SwiftUI

private struct Reward {
    let icon: String
    let title: String
    let detail: String
    let tag: String?
}

private let rewards: [Reward] = [
    Reward(icon: "bolt.fill",
           title: "Precio Silver cada 3 visitas",
           detail: "En tu 3ª visita acumulada disfrutas tarifa preferencial Silver.",
           tag: "VISITA 3"),
    Reward(icon: "gift.fill",
           title: "Visita gratis cada 6 visitas",
           detail: "En tu 6ª visita acumulada la cancha es completamente gratis.",
           tag: "VISITA 6"),
    Reward(icon: "trophy.fill",
           title: "Torneos y clínicas",
           detail: "Notificación temprana y descuentos en torneos del club.",
           tag: nil),
    Reward(icon: "birthday.cake.fill",
           title: "Sorpresas en tu cumpleaños",
           detail: "El club celebra contigo en el mes de tu cumpleaños.",
           tag: nil),
]

struct RewardsView: View {
    var body: some View {
        ScrollView(showsIndicators: false) {
            VStack(alignment: .leading, spacing: 20) {
                VStack(alignment: .leading, spacing: 4) {
                    Text("BENEFICIOS")
                        .font(.custom("BebasNeue-Regular", size: 34))
                        .foregroundColor(.white)
                    Text("Exclusivos para socios del club")
                        .font(.system(size: 13))
                        .foregroundColor(.white.opacity(0.45))
                }
                .padding(.top, 20)

                VStack(spacing: 12) {
                    ForEach(rewards, id: \.title) { r in
                        RewardRow(reward: r)
                    }
                }

                Spacer().frame(height: 80)
            }
            .padding(.horizontal, 24)
        }
    }
}

private struct RewardRow: View {
    let reward: Reward

    var body: some View {
        HStack(alignment: .top, spacing: 14) {
            ZStack {
                Circle()
                    .fill(Color.lime.opacity(0.13))
                    .frame(width: 44, height: 44)
                Image(systemName: reward.icon)
                    .font(.system(size: 17))
                    .foregroundColor(.lime)
            }

            VStack(alignment: .leading, spacing: 5) {
                HStack(spacing: 7) {
                    Text(reward.title)
                        .font(.system(size: 14, weight: .semibold))
                        .foregroundColor(.white)
                    if let tag = reward.tag {
                        Text(tag)
                            .font(.custom("BebasNeue-Regular", size: 11))
                            .foregroundColor(.lime)
                            .padding(.horizontal, 7)
                            .padding(.vertical, 2)
                            .background(Color.navy)
                            .cornerRadius(999)
                    }
                }
                Text(reward.detail)
                    .font(.system(size: 12))
                    .foregroundColor(.white.opacity(0.5))
                    .fixedSize(horizontal: false, vertical: true)
            }
            Spacer()
        }
        .padding(15)
        .background(Color.navy.opacity(0.45))
        .cornerRadius(14)
    }
}
