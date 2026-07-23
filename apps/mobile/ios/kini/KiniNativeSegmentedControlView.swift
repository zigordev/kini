import React
import UIKit

private struct KiniSegmentedOption: Decodable {
  let label: String
  let value: String
}

@objc(KiniNativeSegmentedControlView)
final class KiniNativeSegmentedControlView: UISegmentedControl {
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
      rebuildSegments()
    }
  }

  @objc var selectedValue: NSString = "" {
    didSet { syncSelection() }
  }

  private var options: [KiniSegmentedOption] = []

  override init(frame: CGRect) {
    super.init(frame: frame)
    setup()
  }

  required init?(coder: NSCoder) {
    super.init(coder: coder)
    setup()
  }

  private func setup() {
    selectedSegmentTintColor = UIColor(red: 0.84, green: 0.10, blue: 0.13, alpha: 1)
    setTitleTextAttributes([.foregroundColor: UIColor.label], for: .normal)
    setTitleTextAttributes([.foregroundColor: UIColor.white], for: .selected)
    addTarget(self, action: #selector(valueChanged), for: .valueChanged)
    parseOptions()
    rebuildSegments()
  }

  private func parseOptions() {
    guard let data = String(optionsJson).data(using: .utf8),
          let decoded = try? JSONDecoder().decode([KiniSegmentedOption].self, from: data) else {
      options = []
      return
    }
    options = decoded
  }

  private func rebuildSegments() {
    removeAllSegments()
    options.enumerated().forEach { index, option in
      insertSegment(withTitle: option.label, at: index, animated: false)
    }
    syncSelection()
  }

  private func syncSelection() {
    let value = String(selectedValue)
    selectedSegmentIndex = options.firstIndex { $0.value == value } ?? UISegmentedControl.noSegment
  }

  @objc private func valueChanged() {
    guard selectedSegmentIndex >= 0, selectedSegmentIndex < options.count else {
      return
    }
    let option = options[selectedSegmentIndex]
    selectedValue = option.value as NSString
    onChange?(["value": option.value])
  }
}
