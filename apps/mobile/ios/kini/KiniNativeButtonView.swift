import React
import SwiftUI
import UIKit

private struct KiniButtonHost: View {
  let disabled: Bool
  let title: String
  let variant: String
  let onPress: () -> Void

  var body: some View {
    if variant == "secondary" {
      button
        .buttonStyle(.bordered)
        .controlSize(.regular)
        .tint(tint)
        .disabled(disabled)
    } else {
      button
        .buttonStyle(.borderedProminent)
        .controlSize(.regular)
        .tint(tint)
        .disabled(disabled)
    }
  }

  private var button: some View {
    Button(action: onPress) {
      Text(title)
        .font(.body.weight(.semibold))
        .lineLimit(1)
        .frame(maxWidth: .infinity)
    }
  }

  private var tint: Color {
    switch variant {
    case "destructive":
      return Color(red: 0.71, green: 0.14, blue: 0.09)
    case "secondary":
      return Color(red: 0.08, green: 0.13, blue: 0.18)
    default:
      return Color(red: 0.84, green: 0.10, blue: 0.13)
    }
  }
}

@objc(KiniNativeButtonView)
final class KiniNativeButtonView: UIView {
  @objc var disabled: Bool = false {
    didSet { render() }
  }

  @objc var onPress: RCTBubblingEventBlock?

  @objc var title: NSString = "" {
    didSet { render() }
  }

  @objc var variant: NSString = "primary" {
    didSet { render() }
  }

  private var hostingController: UIHostingController<KiniButtonHost>?

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
    render()
  }

  private func render() {
    let rootView = KiniButtonHost(
      disabled: disabled,
      title: String(title),
      variant: String(variant),
      onPress: { [weak self] in
        self?.onPress?([:])
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
}
