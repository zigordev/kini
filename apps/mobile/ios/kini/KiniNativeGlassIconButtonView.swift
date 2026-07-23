import React
import UIKit

@objc(KiniNativeGlassIconButtonView)
final class KiniNativeGlassIconButtonView: UIControl {
  @objc var accessibilityLabelText: NSString = "" {
    didSet {
      accessibilityLabel = String(accessibilityLabelText)
    }
  }

  @objc var disabled: Bool = false {
    didSet { syncState() }
  }

  @objc var iconName: NSString = "plus" {
    didSet { syncIcon() }
  }

  @objc var onPress: RCTBubblingEventBlock?

  private let blurView = UIVisualEffectView(
    effect: UIBlurEffect(style: .systemUltraThinMaterial)
  )
  private let iconView = UIImageView()

  override init(frame: CGRect) {
    super.init(frame: frame)
    setup()
  }

  required init?(coder: NSCoder) {
    super.init(coder: coder)
    setup()
  }

  override func layoutSubviews() {
    super.layoutSubviews()
    blurView.frame = bounds
    blurView.layer.cornerRadius = min(bounds.width, bounds.height) / 2
  }

  private func setup() {
    backgroundColor = .clear
    isAccessibilityElement = true
    accessibilityTraits = .button

    blurView.isUserInteractionEnabled = false
    blurView.clipsToBounds = true
    blurView.layer.borderWidth = 1
    blurView.layer.borderColor = UIColor.white.withAlphaComponent(0.72).cgColor
    addSubview(blurView)

    iconView.translatesAutoresizingMaskIntoConstraints = false
    iconView.tintColor = UIColor(red: 0.84, green: 0.10, blue: 0.13, alpha: 1)
    iconView.contentMode = .scaleAspectFit
    addSubview(iconView)

    NSLayoutConstraint.activate([
      iconView.centerXAnchor.constraint(equalTo: centerXAnchor),
      iconView.centerYAnchor.constraint(equalTo: centerYAnchor),
      iconView.widthAnchor.constraint(equalToConstant: 21),
      iconView.heightAnchor.constraint(equalToConstant: 21),
    ])

    layer.shadowColor = UIColor.black.cgColor
    layer.shadowOpacity = 0.14
    layer.shadowRadius = 14
    layer.shadowOffset = CGSize(width: 0, height: 6)

    addTarget(self, action: #selector(press), for: .touchUpInside)
    syncIcon()
    syncState()
  }

  private func syncIcon() {
    iconView.image = UIImage(systemName: systemImageName(for: String(iconName)))
    iconView.setNeedsLayout()
  }

  private func systemImageName(for iconName: String) -> String {
    switch iconName {
    case "sync":
      return "arrow.triangle.2.circlepath"
    default:
      return "plus"
    }
  }

  private func syncState() {
    isEnabled = !disabled
    alpha = disabled ? 0.45 : 1
  }

  @objc private func press() {
    guard !disabled else {
      return
    }

    onPress?([:])
  }
}
