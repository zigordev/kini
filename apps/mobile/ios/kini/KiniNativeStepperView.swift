import React
import SwiftUI
import UIKit

private struct KiniStepperHost: View {
  let disabled: Bool
  let maximumValue: Double
  let minimumValue: Double
  let step: Double
  let value: Double
  let onChange: (Double) -> Void

  var body: some View {
    Stepper(
      value: Binding(
        get: { value },
        set: { onChange($0) }
      ),
      in: minimumValue...maximumValue,
      step: step
    ) {
      EmptyView()
    }
    .disabled(disabled)
    .labelsHidden()
    .fixedSize()
  }
}
@objc(KiniNativeStepperView)
final class KiniNativeStepperView: UIView {
  @objc var disabled: Bool = false {
    didSet { render() }
  }

  @objc var maximumValue: NSNumber = 8 {
    didSet { updateValue(currentValue, emit: false) }
  }

  @objc var minimumValue: NSNumber = 0 {
    didSet { updateValue(currentValue, emit: false) }
  }

  @objc var onChange: RCTBubblingEventBlock?

  @objc var step: NSNumber = 1 {
    didSet { render() }
  }

  @objc var value: NSNumber = 0 {
    didSet { updateValue(value.doubleValue, emit: false) }
  }

  private var currentValue: Double = 0
  private var hostingController: UIHostingController<KiniStepperHost>?

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
    hostingController?.view.frame = bounds
  }

  private func setup() {
    backgroundColor = .clear
    render()
  }

  private func render() {
    let rootView = KiniStepperHost(
      disabled: disabled,
      maximumValue: maximumValue.doubleValue,
      minimumValue: minimumValue.doubleValue,
      step: max(step.doubleValue, 1),
      value: currentValue,
      onChange: { [weak self] nextValue in
        self?.updateValue(nextValue, emit: true)
      }
    )

    if let hostingController {
      hostingController.rootView = rootView
    } else {
      let controller = UIHostingController(rootView: rootView)
      controller.view.backgroundColor = .clear
      controller.view.translatesAutoresizingMaskIntoConstraints = false
      addSubview(controller.view)
      NSLayoutConstraint.activate([
        controller.view.leadingAnchor.constraint(equalTo: leadingAnchor),
        controller.view.trailingAnchor.constraint(equalTo: trailingAnchor),
        controller.view.topAnchor.constraint(equalTo: topAnchor),
        controller.view.bottomAnchor.constraint(equalTo: bottomAnchor),
      ])
      hostingController = controller
    }
  }

  private func updateValue(_ nextValue: Double, emit: Bool) {
    let minValue = minimumValue.doubleValue
    let maxValue = maximumValue.doubleValue
    let clampedValue = min(max(nextValue, minValue), maxValue)

    guard clampedValue != currentValue else {
      render()
      return
    }

    currentValue = clampedValue
    render()

    if emit {
      onChange?(["value": clampedValue])
    }
  }
}
