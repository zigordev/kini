import React
import UIKit

private struct KiniSelectOption: Decodable {
  let label: String
  let value: String
}

@objc(KiniNativeSelectView)
final class KiniNativeSelectView: UIButton {
  @objc var appearance: NSString = "field" {
    didSet {
      applyAppearance()
      syncTitle()
    }
  }

  @objc var disabled: Bool = false {
    didSet {
      isEnabled = !disabled
      alpha = disabled ? 0.55 : 1
    }
  }

  @objc var onChange: RCTBubblingEventBlock?

  @objc var optionsJson: NSString = "[]" {
    didSet {
      parseOptions()
      syncTitle()
    }
  }

  @objc var placeholder: NSString = "" {
    didSet { syncTitle() }
  }

  @objc var selectedValue: NSString = "" {
    didSet { syncTitle() }
  }

  @objc var title: NSString = ""

  private var options: [KiniSelectOption] = []

  override init(frame: CGRect) {
    super.init(frame: frame)
    setup()
  }

  required init?(coder: NSCoder) {
    super.init(coder: coder)
    setup()
  }

  private func setup() {
    addTarget(self, action: #selector(openPicker), for: .touchUpInside)
    applyAppearance()
    parseOptions()
    syncTitle()
  }

  private func applyAppearance() {
    if String(appearance) == "primary" {
      layer.borderWidth = 0
      layer.cornerRadius = 0
      contentHorizontalAlignment = .center

      if #available(iOS 15.0, *) {
        var config = UIButton.Configuration.borderedProminent()
        config.baseBackgroundColor = UIColor(red: 0.84, green: 0.10, blue: 0.13, alpha: 1)
        config.baseForegroundColor = .white
        config.cornerStyle = .medium
        config.buttonSize = .medium
        config.contentInsets = NSDirectionalEdgeInsets(top: 8, leading: 14, bottom: 8, trailing: 14)
        config.titleTextAttributesTransformer = UIConfigurationTextAttributesTransformer { incoming in
          var outgoing = incoming
          outgoing.font = UIFont.systemFont(ofSize: 17, weight: .semibold)
          return outgoing
        }
        configuration = config
      } else {
        backgroundColor = UIColor(red: 0.84, green: 0.10, blue: 0.13, alpha: 1)
        layer.cornerRadius = 8
        contentEdgeInsets = UIEdgeInsets(top: 0, left: 14, bottom: 0, right: 14)
        setTitleColor(.white, for: .normal)
      }
      titleLabel?.font = .systemFont(ofSize: 17, weight: .semibold)
      return
    }

    if #available(iOS 15.0, *) {
      configuration = nil
    }
    backgroundColor = .clear
    layer.cornerRadius = 8
    layer.borderWidth = 1
    layer.borderColor = UIColor.separator.cgColor
    contentEdgeInsets = UIEdgeInsets(top: 0, left: 12, bottom: 0, right: 12)
    setTitleColor(.label, for: .normal)
    titleLabel?.font = .systemFont(ofSize: 17, weight: .regular)
    contentHorizontalAlignment = .leading
  }

  private func parseOptions() {
    guard let data = String(optionsJson).data(using: .utf8),
          let decoded = try? JSONDecoder().decode([KiniSelectOption].self, from: data) else {
      options = []
      return
    }
    options = decoded
  }

  private func syncTitle() {
    let selected = options.first { $0.value == String(selectedValue) }
    let nextTitle = selected?.label ?? String(placeholder)
    if #available(iOS 15.0, *), String(appearance) == "primary" {
      var config = configuration ?? UIButton.Configuration.borderedProminent()
      config.title = nextTitle
      configuration = config
    } else {
      setTitle(nextTitle, for: .normal)
    }
  }

  @objc private func openPicker() {
    guard let viewController = findViewController(), !options.isEmpty else {
      return
    }

    let alert = UIAlertController(
      title: String(title),
      message: nil,
      preferredStyle: .actionSheet
    )

    options.forEach { option in
      alert.addAction(
        UIAlertAction(title: option.label, style: .default) { [weak self] _ in
          self?.selectedValue = option.value as NSString
          self?.onChange?(["value": option.value])
        }
      )
    }
    alert.addAction(UIAlertAction(title: "Cancel", style: .cancel))

    if let popover = alert.popoverPresentationController {
      popover.sourceView = self
      popover.sourceRect = bounds
    }
    viewController.present(alert, animated: true)
  }

  private func findViewController() -> UIViewController? {
    var responder: UIResponder? = self
    while let current = responder {
      if let viewController = current as? UIViewController {
        return viewController
      }
      responder = current.next
    }
    return nil
  }
}
