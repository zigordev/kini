import React
import UIKit

@objc(KiniNativeDatePickerView)
final class KiniNativeDatePickerView: UIView {
  @objc var disabled: Bool = false {
    didSet {
      datePicker.isEnabled = !disabled
      alpha = disabled ? 0.55 : 1
    }
  }

  @objc var label: NSString = ""

  @objc var onChange: RCTBubblingEventBlock?

  @objc var value: NSNumber = 0 {
    didSet {
      let date = Date(timeIntervalSince1970: value.doubleValue / 1000)
      if abs(datePicker.date.timeIntervalSince(date)) > 1 {
        datePicker.date = date
      }
    }
  }

  private let datePicker = UIDatePicker()

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
    datePicker.datePickerMode = .date
    if #available(iOS 14.0, *) {
      datePicker.preferredDatePickerStyle = .compact
    }
    datePicker.translatesAutoresizingMaskIntoConstraints = false
    datePicker.addTarget(self, action: #selector(dateChanged), for: .valueChanged)
    addSubview(datePicker)

    NSLayoutConstraint.activate([
      datePicker.leadingAnchor.constraint(equalTo: leadingAnchor),
      datePicker.trailingAnchor.constraint(equalTo: trailingAnchor),
      datePicker.topAnchor.constraint(equalTo: topAnchor),
      datePicker.bottomAnchor.constraint(equalTo: bottomAnchor),
    ])
  }

  @objc private func dateChanged() {
    onChange?(["value": datePicker.date.timeIntervalSince1970 * 1000])
  }
}
