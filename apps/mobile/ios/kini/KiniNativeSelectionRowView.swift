import React
import SwiftUI
import UIKit

private struct KiniSelectionRowHost: View {
  let disabled: Bool
  let selected: Bool
  let title: String
  let onPress: () -> Void

  var body: some View {
    Button(action: onPress) {
      HStack(spacing: 12) {
        Image(systemName: selected ? "checkmark.circle.fill" : "person.2.circle")
          .font(.title3)
          .foregroundColor(selected ? tint : Color.secondary)

        Text(title)
          .font(.body.weight(.semibold))
          .foregroundColor(Color.primary)
          .lineLimit(1)

        Spacer(minLength: 8)

        Image(systemName: "chevron.right")
          .font(.footnote.weight(.semibold))
          .foregroundColor(Color.secondary)
      }
      .padding(.horizontal, 14)
      .frame(maxWidth: .infinity, minHeight: 54)
      .background(
        RoundedRectangle(cornerRadius: 10, style: .continuous)
          .fill(Color(uiColor: .secondarySystemGroupedBackground))
      )
      .overlay(
        RoundedRectangle(cornerRadius: 10, style: .continuous)
          .stroke(selected ? tint : Color(uiColor: .separator), lineWidth: 1)
      )
      .contentShape(Rectangle())
    }
    .buttonStyle(.plain)
    .disabled(disabled)
    .opacity(disabled ? 0.45 : 1)
  }

  private var tint: Color {
    Color(red: 0.84, green: 0.10, blue: 0.13)
  }
}

@objc(KiniNativeSelectionRowView)
final class KiniNativeSelectionRowView: UIView {
  @objc var disabled: Bool = false {
    didSet { render() }
  }

  @objc var onPress: RCTBubblingEventBlock?

  @objc var selected: Bool = false {
    didSet { render() }
  }

  @objc var title: NSString = "" {
    didSet { render() }
  }

  private var hostingController: UIHostingController<KiniSelectionRowHost>?

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
    let rootView = KiniSelectionRowHost(
      disabled: disabled,
      selected: selected,
      title: String(title),
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
