import React
import UIKit

@objc(KiniNativeOptionStackView)
final class KiniNativeOptionStackView: UIView {
  @objc var disabled: Bool = false {
    didSet { render() }
  }

  @objc var onSelect: RCTBubblingEventBlock?

  @objc var optionsJson: NSString = "[]" {
    didSet { render() }
  }

  @objc var outcome: NSString = "neutral" {
    didSet { render() }
  }

  @objc var selectedOptionsJson: NSString = "[]" {
    didSet { render() }
  }

  private let stackView = UIStackView()

  override init(frame: CGRect) {
    super.init(frame: frame)
    setup()
  }

  required init?(coder: NSCoder) {
    super.init(coder: coder)
    setup()
  }

  private func setup() {
    backgroundColor = .clear
    stackView.axis = .horizontal
    stackView.alignment = .center
    stackView.distribution = .fillEqually
    stackView.spacing = 4
    stackView.translatesAutoresizingMaskIntoConstraints = false
    addSubview(stackView)
    NSLayoutConstraint.activate([
      stackView.leadingAnchor.constraint(equalTo: leadingAnchor),
      stackView.trailingAnchor.constraint(equalTo: trailingAnchor),
      stackView.topAnchor.constraint(equalTo: topAnchor),
      stackView.bottomAnchor.constraint(equalTo: bottomAnchor),
    ])
    render()
  }

  private func render() {
    let options = decodeStringArray(optionsJson)
    let selectedOptions = Set(decodeStringArray(selectedOptionsJson))

    stackView.arrangedSubviews.forEach { view in
      stackView.removeArrangedSubview(view)
      view.removeFromSuperview()
    }

    options.forEach { option in
      let button = UIButton(type: .system)
      button.isEnabled = !disabled
      button.accessibilityLabel = option
      button.accessibilityIdentifier = option
      button.addTarget(self, action: #selector(handlePress(_:)), for: .touchUpInside)

      applyConfiguration(
        to: button,
        title: option,
        selected: selectedOptions.contains(option)
      )
      stackView.addArrangedSubview(button)
    }
  }

  private func applyConfiguration(to button: UIButton, title: String, selected: Bool) {
    var config = selected
      ? UIButton.Configuration.borderedProminent()
      : UIButton.Configuration.bordered()
    config.title = title
    config.buttonSize = .medium
    config.cornerStyle = .medium
    config.contentInsets = NSDirectionalEdgeInsets(
      top: 4,
      leading: 0,
      bottom: 4,
      trailing: 0
    )

    if selected {
      config.baseBackgroundColor = selectedTint()
      config.baseForegroundColor = .white
    } else {
      config.baseForegroundColor = .label
    }

    config.titleTextAttributesTransformer = UIConfigurationTextAttributesTransformer { incoming in
      var outgoing = incoming
      outgoing.font = UIFont.systemFont(ofSize: 15, weight: .semibold)
      return outgoing
    }
    button.configuration = config
  }

  private func selectedTint() -> UIColor {
    switch String(outcome) {
    case "success":
      return UIColor(red: 0.08, green: 0.50, blue: 0.23, alpha: 1)
    case "failure":
      return UIColor(red: 0.71, green: 0.14, blue: 0.09, alpha: 1)
    default:
      return UIColor.systemGray
    }
  }

  @objc private func handlePress(_ sender: UIButton) {
    guard !disabled, let value = sender.accessibilityIdentifier else {
      return
    }
    onSelect?(["value": value])
  }

  private func decodeStringArray(_ source: NSString) -> [String] {
    guard let data = String(source).data(using: .utf8),
          let decoded = try? JSONDecoder().decode([String].self, from: data) else {
      return []
    }
    return decoded
  }
}
