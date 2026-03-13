import SwiftUI

struct SpeedReaderPanelView: View {
    @EnvironmentObject private var settings: ReaderSettingsStore
    @Environment(\.verticalSizeClass) private var verticalSizeClass
    @ObservedObject var playback: PlaybackEngine

    var showProgressSlider = true
    var showWpmControl = true
    var fillHeight = false

    private var parts: (left: String, focal: String, right: String) {
        SpeedReaderCore.wordParts(for: playback.activeWord)
    }

    private var progressLabel: String {
        if playback.words.isEmpty { return "0/0" }
        return "\(playback.wordIndex + 1)/\(playback.words.count)"
    }

    private var remainingTimeLabel: String {
        let ms = playback.remainingReadingTimeMs()
        return SpeedReaderCore.readingTimeLabel(ms: ms)
    }

    private var controlsOpacity: CGFloat {
        playback.isPlaying ? 0.45 : 1
    }

    private var isCompactHeight: Bool {
        verticalSizeClass == .compact
    }

    private var readerBoxMinHeight: CGFloat {
        isCompactHeight ? 120 : 220
    }

    private var readerBoxMaxHeight: CGFloat {
        if isCompactHeight {
            return 160
        }
        return fillHeight ? .infinity : 260
    }

    private var centerLineHeight: CGFloat {
        isCompactHeight ? 120 : 240
    }

    private var topBottomInset: CGFloat {
        isCompactHeight ? 20 : 34
    }

    private var panelCornerRadius: CGFloat {
        isCompactHeight ? 14 : 16
    }

    var body: some View {
        VStack(spacing: isCompactHeight ? 10 : 14) {
            ZStack {
                RoundedRectangle(cornerRadius: panelCornerRadius, style: .continuous)
                    .fill(
                        Color(red: 0.16, green: 0.16, blue: 0.17)
                    )
                    .overlay(
                        RoundedRectangle(cornerRadius: panelCornerRadius, style: .continuous)
                            .stroke(Color.white.opacity(0.14), lineWidth: 1)
                    )

                GeometryReader { geometry in
                    ZStack {
                        Rectangle()
                            .fill(Color.white.opacity(0.16))
                            .frame(width: 1, height: centerLineHeight)
                            .position(x: geometry.size.width / 2, y: geometry.size.height / 2)

                        Rectangle()
                            .fill(Color.white.opacity(0.12))
                            .frame(height: 1)
                            .position(x: geometry.size.width / 2, y: topBottomInset)

                        Rectangle()
                            .fill(Color.white.opacity(0.12))
                            .frame(height: 1)
                            .position(
                                x: geometry.size.width / 2,
                                y: geometry.size.height - topBottomInset
                            )

                        HStack(spacing: 0) {
                            Text(parts.left)
                                .font(settings.font(size: settings.fontSize.pointSize))
                                .foregroundStyle(Color.white.opacity(0.88))
                                .frame(maxWidth: .infinity, alignment: .trailing)

                            Text(parts.focal.isEmpty ? "•" : parts.focal)
                                .font(settings.font(size: settings.fontSize.pointSize))
                                .foregroundStyle(settings.focalColor.color)

                            Text(parts.right)
                                .font(settings.font(size: settings.fontSize.pointSize))
                                .foregroundStyle(Color.white.opacity(0.88))
                                .frame(maxWidth: .infinity, alignment: .leading)
                        }
                        .padding(.horizontal, 20)
                    }
                }
                .clipShape(RoundedRectangle(cornerRadius: panelCornerRadius, style: .continuous))
            }
            .frame(minHeight: readerBoxMinHeight, maxHeight: readerBoxMaxHeight)
            .animation(nil, value: playback.wordIndex)

            VStack(spacing: 10) {
                HStack(spacing: 8) {
                    Text(progressLabel)
                        .font(.subheadline.monospacedDigit())
                    Text("·")
                        .foregroundStyle(.tertiary)
                    Text(remainingTimeLabel)
                        .font(.subheadline.monospacedDigit())
                        .foregroundStyle(.secondary)
                }
                .animation(nil, value: playback.wordIndex)

                if showProgressSlider && !playback.words.isEmpty {
                    Slider(
                        value: Binding(
                            get: { Double(playback.wordIndex) },
                            set: { playback.setWordIndex(Int($0.rounded()), pausePlayback: true) }
                        ),
                        in: 0...Double(max(0, playback.words.count - 1)),
                        step: 1
                    ) { editing in
                        if editing { playback.pause() }
                    }
                    .animation(.easeInOut(duration: 0.15), value: playback.wordIndex)
                }
            }
            .opacity(controlsOpacity)
            .animation(.easeInOut(duration: 0.25), value: playback.isPlaying)

            VStack(spacing: isCompactHeight ? 8 : 10) {
                HStack(spacing: isCompactHeight ? 32 : 40) {
                    Button {
                        guard !playback.words.isEmpty else { return }
                        playback.setWordIndex(max(0, playback.wordIndex - 1), pausePlayback: true)
                    } label: {
                        Image(systemName: "backward.fill")
                            .font(.title2)
                            .frame(minWidth: 44, minHeight: 44)
                            .contentShape(Rectangle())
                    }
                    .accessibilityLabel("Previous word")
                    .keyboardShortcut(.leftArrow, modifiers: [])
                    .disabled(playback.words.isEmpty)
                    .opacity(playback.words.isEmpty ? 0.4 : 1)

                    Button {
                        guard !playback.words.isEmpty else { return }
                        playback.playPauseRestart()
                    } label: {
                        Image(systemName: playback.isPlaying ? "pause.circle.fill" : (playback.isFinished ? "arrow.counterclockwise.circle.fill" : "play.circle.fill"))
                            .font(.system(size: 56))
                            .contentShape(Rectangle())
                    }
                    .accessibilityLabel(playback.isPlaying ? "Pause" : (playback.isFinished ? "Restart" : "Play"))
                    .keyboardShortcut(.space, modifiers: [])
                    .disabled(playback.words.isEmpty)
                    .opacity(playback.words.isEmpty ? 0.4 : 1)
                    .animation(nil, value: playback.isPlaying)

                    Button {
                        guard !playback.words.isEmpty else { return }
                        playback.setWordIndex(min(max(0, playback.words.count - 1), playback.wordIndex + 1), pausePlayback: true)
                    } label: {
                        Image(systemName: "forward.fill")
                            .font(.title2)
                            .frame(minWidth: 44, minHeight: 44)
                            .contentShape(Rectangle())
                    }
                    .accessibilityLabel("Next word")
                    .keyboardShortcut(.rightArrow, modifiers: [])
                    .disabled(playback.words.isEmpty)
                    .opacity(playback.words.isEmpty ? 0.4 : 1)
                }
                .buttonStyle(.plain)
                .animation(nil, value: playback.isPlaying)

                if showWpmControl {
                    HStack {
                        Label("Speed", systemImage: "speedometer")
                            .font(.footnote)
                            .foregroundStyle(.secondary)
                        Spacer()
                        Stepper(value: $settings.wordsPerMinute, in: 50...1200, step: 50) {
                            Text("\(settings.wordsPerMinute) wpm")
                                .font(.subheadline.monospacedDigit())
                        }
                    }
                }
            }
            .opacity(controlsOpacity)
            .animation(.easeInOut(duration: 0.25), value: playback.isPlaying)
        }
        .onAppear {
            syncTiming()
        }
        .onChange(of: settings.wordsPerMinute) { _, _ in syncTiming() }
        .onChange(of: settings.sentenceEndDurationMs) { _, _ in syncTiming() }
        .onChange(of: settings.speechBreakDurationMs) { _, _ in syncTiming() }
        .background {
            Group {
                Button("Restart") {
                    guard !playback.words.isEmpty else { return }
                    playback.setWordIndex(0, pausePlayback: true)
                    playback.playPauseRestart()
                }
                .keyboardShortcut("r", modifiers: [])
                Button("Start") {
                    guard !playback.words.isEmpty else { return }
                    playback.setWordIndex(0, pausePlayback: true)
                }
                .keyboardShortcut(.home, modifiers: [])
                Button("End") {
                    guard !playback.words.isEmpty else { return }
                    playback.setWordIndex(max(0, playback.words.count - 1), pausePlayback: true)
                }
                .keyboardShortcut(.end, modifiers: [])
            }
            .opacity(0)
            .accessibilityHidden(true)
            .allowsHitTesting(false)
        }
    }

    private func syncTiming() {
        playback.configureTiming(
            wordsPerMinute: settings.wordsPerMinute,
            sentenceEndDurationMs: settings.sentenceEndDurationMs,
            speechBreakDurationMs: settings.speechBreakDurationMs
        )
    }
}
