import React
import UIKit

@objc(KiniNativeSwitchView)
final class KiniNativeSwitchView: UISwitch {
  @objc var checked: Bool = false {
    didSet {
      if isOn != checked {
        setOn(checked, animated: false)
      }
    }
  }

  @objc var disabled: Bool = false {
    didSet {
      isEnabled = !disabled
      alpha = disabled ? 0.55 : 1
    }
  }

  @objc var onChange: RCTBubblingEventBlock?

  override init(frame: CGRect) {
    super.init(frame: frame)
    setup()
  }

  required init?(coder: NSCoder) {
    super.init(coder: coder)
    setup()
  }

  private func setup() {
    onTintColor = UIColor(red: 0.04, green: 0.44, blue: 0.71, alpha: 1)
    addTarget(self, action: #selector(valueChanged), for: .valueChanged)
  }

  @objc private func valueChanged() {
    checked = isOn
    onChange?(["value": isOn])
  }
}
