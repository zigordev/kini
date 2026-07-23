import React
import UIKit

@objc(KiniNativeToast)
final class KiniNativeToast: NSObject {
  private static let bannerTag = 982031

  @objc
  static func requiresMainQueueSetup() -> Bool {
    true
  }

  @objc(show:type:)
  func show(_ message: String, type: String) {
    DispatchQueue.main.async {
      guard let window = Self.keyWindow else {
        return
      }

      window.viewWithTag(Self.bannerTag)?.removeFromSuperview()

      let banner = UIView()
      banner.tag = Self.bannerTag
      banner.translatesAutoresizingMaskIntoConstraints = false
      banner.backgroundColor = Self.backgroundColor(for: type)
      banner.layer.cornerRadius = 14
      banner.layer.cornerCurve = .continuous
      banner.layer.shadowColor = UIColor.black.cgColor
      banner.layer.shadowOpacity = 0.16
      banner.layer.shadowRadius = 18
      banner.layer.shadowOffset = CGSize(width: 0, height: 8)

      let label = UILabel()
      label.translatesAutoresizingMaskIntoConstraints = false
      label.text = message
      label.textColor = .white
      label.font = .preferredFont(forTextStyle: .subheadline)
      label.adjustsFontForContentSizeCategory = true
      label.numberOfLines = 3

      banner.addSubview(label)
      window.addSubview(banner)

      NSLayoutConstraint.activate([
        banner.leadingAnchor.constraint(equalTo: window.leadingAnchor, constant: 16),
        banner.trailingAnchor.constraint(equalTo: window.trailingAnchor, constant: -16),
        banner.topAnchor.constraint(equalTo: window.safeAreaLayoutGuide.topAnchor, constant: 12),
        label.leadingAnchor.constraint(equalTo: banner.leadingAnchor, constant: 16),
        label.trailingAnchor.constraint(equalTo: banner.trailingAnchor, constant: -16),
        label.topAnchor.constraint(equalTo: banner.topAnchor, constant: 12),
        label.bottomAnchor.constraint(equalTo: banner.bottomAnchor, constant: -12),
      ])

      banner.alpha = 0
      banner.transform = CGAffineTransform(translationX: 0, y: -16)
      UIView.animate(
        withDuration: 0.22,
        delay: 0,
        options: [.curveEaseOut, .allowUserInteraction],
        animations: {
          banner.alpha = 1
          banner.transform = .identity
        }
      )

      UIView.animate(
        withDuration: 0.2,
        delay: 3.8,
        options: [.curveEaseIn, .allowUserInteraction],
        animations: {
          banner.alpha = 0
          banner.transform = CGAffineTransform(translationX: 0, y: -16)
        },
        completion: { _ in
          banner.removeFromSuperview()
        }
      )
    }
  }

  private static var keyWindow: UIWindow? {
    return UIApplication.shared.connectedScenes
      .compactMap { $0 as? UIWindowScene }
      .flatMap(\.windows)
      .first { $0.isKeyWindow }
  }

  private static func backgroundColor(for type: String) -> UIColor {
    switch type {
    case "error":
      return UIColor(red: 0.71, green: 0.14, blue: 0.09, alpha: 1)
    case "success":
      return UIColor(red: 0.08, green: 0.50, blue: 0.23, alpha: 1)
    case "warning":
      return UIColor(red: 0.66, green: 0.42, blue: 0.00, alpha: 1)
    default:
      return UIColor(red: 0.04, green: 0.44, blue: 0.71, alpha: 1)
    }
  }
}
