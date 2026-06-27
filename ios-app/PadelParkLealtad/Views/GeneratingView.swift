import SwiftUI

struct GeneratingView: View {
    @State private var rotation: Double = 0
    @State private var appear = false

    var body: some View {
        ZStack {
            Color.navyInk.ignoresSafeArea()

            VStack(spacing: 28) {
                ZStack {
                    Circle()
                        .stroke(Color.lime.opacity(0.15), lineWidth: 3)
                        .frame(width: 76, height: 76)
                    Circle()
                        .trim(from: 0, to: 0.72)
                        .stroke(
                            Color.lime,
                            style: StrokeStyle(lineWidth: 3, lineCap: .round)
                        )
                        .frame(width: 76, height: 76)
                        .rotationEffect(.degrees(rotation))
                }
                .scaleEffect(appear ? 1 : 0.7)
                .opacity(appear ? 1 : 0)

                VStack(spacing: 6) {
                    Text("GENERANDO\nTU TARJETA")
                        .font(.custom("BebasNeue-Regular", size: 36))
                        .foregroundColor(.white)
                        .multilineTextAlignment(.center)
                        .lineSpacing(2)
                    Text("Un momento...")
                        .font(.system(size: 13))
                        .foregroundColor(.white.opacity(0.45))
                }
                .opacity(appear ? 1 : 0)
            }
        }
        .onAppear {
            withAnimation(.easeOut(duration: 0.5)) { appear = true }
            withAnimation(.linear(duration: 1.1).repeatForever(autoreverses: false)) {
                rotation = 360
            }
        }
    }
}
