import SwiftUI

struct FullscreenReaderView: View {
    @EnvironmentObject private var settings: ReaderSettingsStore
    @ObservedObject var playback: PlaybackEngine
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        GeometryReader { geometry in
            let availableHeight = geometry.size.height - 180
            let availableWidth = geometry.size.width - 32
            let dimension = max(availableWidth, availableHeight)
            let scaledSize = dimension * 0.18
            let fontSize = min(140, max(settings.fontSize.pointSize, scaledSize))

            ZStack(alignment: .topTrailing) {
                settings.appBackgroundColor
                    .ignoresSafeArea()

                SpeedReaderPanelView(playback: playback, fillHeight: true, fontSizeOverride: fontSize)
                    .padding(.horizontal, 16)
                    .padding(.vertical, 20)

                Button {
                    dismiss()
                } label: {
                    Image(systemName: "xmark.circle.fill")
                        .font(.title2)
                        .symbolRenderingMode(.hierarchical)
                }
                .padding(16)
                .accessibilityLabel("Exit fullscreen")
            }
        }
    }
}
