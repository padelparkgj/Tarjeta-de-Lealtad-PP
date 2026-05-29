import SwiftUI
import Photos

struct CardExporter {
    static func save(member: Member, completion: @escaping (Bool) -> Void) {
        PHPhotoLibrary.requestAuthorization(for: .addOnly) { status in
            guard status == .authorized || status == .limited else {
                DispatchQueue.main.async { completion(false) }
                return
            }
            Task { @MainActor in
                let renderer = ImageRenderer(
                    content: ExportCardView(member: member)
                        .frame(width: 400, height: 228)
                )
                renderer.scale = 3.0
                guard let image = renderer.uiImage else {
                    completion(false)
                    return
                }
                PHPhotoLibrary.shared().performChanges({
                    PHAssetChangeRequest.creationRequestForAsset(from: image)
                }, completionHandler: { ok, _ in
                    DispatchQueue.main.async { completion(ok) }
                })
            }
        }
    }
}

// Standalone card used for PNG rendering (no @EnvironmentObject)
private struct ExportCardView: View {
    let member: Member

    var body: some View {
        ZStack {
            LinearGradient(
                colors: [Color.navy, Color.navyDeep],
                startPoint: .topLeading, endPoint: .bottomTrailing
            )

            Circle()
                .fill(Color.lime.opacity(0.07))
                .frame(width: 280, height: 280)
                .offset(x: 120, y: -80)

            VStack(alignment: .leading, spacing: 0) {
                HStack(alignment: .top) {
                    VStack(alignment: .leading, spacing: 2) {
                        Text("PADEL PARK")
                            .font(.custom("BebasNeue-Regular", size: 20))
                            .foregroundColor(.white)
                            .kerning(1.5)
                        Text("Gran Jardín · León, Gto")
                            .font(.system(size: 10))
                            .foregroundColor(.white.opacity(0.45))
                    }
                    Spacer()
                    ZStack {
                        Circle().fill(Color.lime).frame(width: 34, height: 34)
                        Text("PP")
                            .font(.custom("BebasNeue-Regular", size: 15))
                            .foregroundColor(.navyInk)
                    }
                }

                Spacer()

                HStack(alignment: .bottom, spacing: 12) {
                    VStack(alignment: .leading, spacing: 5) {
                        Text(member.name.uppercased())
                            .font(.custom("BebasNeue-Regular", size: 28))
                            .foregroundColor(.white)
                            .lineLimit(1)
                            .minimumScaleFactor(0.55)
                        HStack(spacing: 6) {
                            Text(member.level)
                                .font(.system(size: 9, weight: .semibold))
                                .foregroundColor(.navyInk)
                                .padding(.horizontal, 8)
                                .padding(.vertical, 3)
                                .background(Color.lime)
                                .cornerRadius(4)
                            Text(member.joinedFormatted)
                                .font(.system(size: 9))
                                .foregroundColor(.white.opacity(0.4))
                        }
                    }
                    Spacer()
                    QRCodeView(payload: member.qrPayload, size: 68)
                        .padding(4)
                        .background(Color.white)
                        .cornerRadius(6)
                }

                Spacer().frame(height: 10)

                Text(member.id)
                    .font(.system(size: 12, weight: .medium, design: .monospaced))
                    .foregroundColor(.lime)
            }
            .padding(20)
        }
        .frame(width: 400, height: 228)
        .cornerRadius(20)
    }
}
