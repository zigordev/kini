import React
import UIKit

@objc(KiniNativeBottomNavView)
final class KiniNativeBottomNavView: UIView, UITabBarDelegate {
  @objc var availablePoolsTitle: NSString = "" {
    didSet { rebuildItems() }
  }

  @objc var onSelect: RCTBubblingEventBlock?

  @objc var poolsTitle: NSString = "" {
    didSet { rebuildItems() }
  }

  @objc var profileTitle: NSString = "" {
    didSet { rebuildItems() }
  }

  @objc var selectedTab: NSString = "pools" {
    didSet { syncSelectedItem() }
  }

  @objc var statsTitle: NSString = "" {
    didSet { rebuildItems() }
  }

  private let tabBar = UITabBar()
  private let tabOrder = ["available-pools", "pools", "stats", "profile"]
  private var didBuildItems = false

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
    tabBar.delegate = self
    tabBar.isTranslucent = true
    tabBar.itemPositioning = .fill
    tabBar.backgroundColor = .clear
    applyAppearance()
    tabBar.translatesAutoresizingMaskIntoConstraints = false
    addSubview(tabBar)

    NSLayoutConstraint.activate([
      tabBar.leadingAnchor.constraint(equalTo: leadingAnchor),
      tabBar.trailingAnchor.constraint(equalTo: trailingAnchor),
      tabBar.topAnchor.constraint(equalTo: topAnchor),
      tabBar.bottomAnchor.constraint(equalTo: bottomAnchor),
    ])

    rebuildItems()
  }

  private func applyAppearance() {
    let selectedColor = UIColor(red: 0.84, green: 0.10, blue: 0.13, alpha: 1)
    let normalColor = UIColor.secondaryLabel
    let appearance = UITabBarAppearance()
    appearance.configureWithDefaultBackground()

    appearance.stackedLayoutAppearance.selected.iconColor = selectedColor
    appearance.stackedLayoutAppearance.selected.titleTextAttributes = [
      .foregroundColor: selectedColor,
      .font: UIFont.systemFont(ofSize: 10, weight: .semibold),
    ]
    appearance.stackedLayoutAppearance.normal.iconColor = normalColor
    appearance.stackedLayoutAppearance.normal.titleTextAttributes = [
      .foregroundColor: normalColor,
      .font: UIFont.systemFont(ofSize: 10, weight: .regular),
    ]

    tabBar.tintColor = selectedColor
    tabBar.unselectedItemTintColor = normalColor
    tabBar.standardAppearance = appearance
    if #available(iOS 15.0, *) {
      tabBar.scrollEdgeAppearance = appearance
    }
  }

  private func rebuildItems() {
    let items = tabOrder.enumerated().map { index, key in
      let item = UITabBarItem(
        title: title(for: key),
        image: UIImage(systemName: symbol(for: key)),
        selectedImage: UIImage(systemName: selectedSymbol(for: key))
      )
      item.tag = index
      return item
    }

    didBuildItems = true
    tabBar.items = items
    syncSelectedItem()
  }

  private func syncSelectedItem() {
    guard didBuildItems, let items = tabBar.items else {
      return
    }

    let selectedKey = String(selectedTab)
    let index = tabOrder.firstIndex(of: selectedKey) ?? 0
    tabBar.selectedItem = items[index]
  }

  private func title(for key: String) -> String {
    switch key {
    case "available-pools":
      return String(availablePoolsTitle)
    case "pools":
      return String(poolsTitle)
    case "stats":
      return String(statsTitle)
    default:
      return String(profileTitle)
    }
  }

  private func symbol(for key: String) -> String {
    switch key {
    case "available-pools":
      return "calendar"
    case "pools":
      return "doc.text"
    case "stats":
      return "chart.bar"
    default:
      return "person"
    }
  }

  private func selectedSymbol(for key: String) -> String {
    switch key {
    case "available-pools":
      return "calendar"
    case "pools":
      return "doc.text.fill"
    case "stats":
      return "chart.bar.fill"
    default:
      return "person.fill"
    }
  }

  func tabBar(_ tabBar: UITabBar, didSelect item: UITabBarItem) {
    guard item.tag >= 0, item.tag < tabOrder.count else {
      return
    }

    let key = tabOrder[item.tag]
    selectedTab = key as NSString
    onSelect?(["tab": key])
  }
}
