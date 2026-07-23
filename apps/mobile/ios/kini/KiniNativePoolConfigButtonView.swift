import React
import UIKit

@objc(KiniNativePoolConfigButtonView)
final class KiniNativePoolConfigButtonView: UIControl {
  @objc var disabled: Bool = false {
    didSet { syncState() }
  }

  @objc var doneTitle: NSString = "OK"
  @objc var doubles: NSNumber = 0
  @objc var doublesTitle: NSString = "Dobles"
  @objc var elige8: Bool = false
  @objc var e8Title: NSString = "E8"
  @objc var maxDoubles: NSNumber = 14
  @objc var maxTriples: NSNumber = 9
  @objc var minDoubles: NSNumber = 0
  @objc var minTriples: NSNumber = 0
  @objc var onChange: RCTBubblingEventBlock?
  @objc var title: NSString = "Configuración"
  @objc var triples: NSNumber = 0
  @objc var triplesTitle: NSString = "Triples"

  private let blurView = UIVisualEffectView(
    effect: UIBlurEffect(style: .systemUltraThinMaterial)
  )
  private let iconView = UIImageView()

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
    blurView.frame = bounds
    blurView.layer.cornerRadius = min(bounds.width, bounds.height) / 2
  }

  private func setup() {
    backgroundColor = .clear
    isAccessibilityElement = true
    accessibilityTraits = .button

    blurView.isUserInteractionEnabled = false
    blurView.clipsToBounds = true
    blurView.layer.borderWidth = 1
    blurView.layer.borderColor = UIColor.white.withAlphaComponent(0.72).cgColor
    addSubview(blurView)

    iconView.translatesAutoresizingMaskIntoConstraints = false
    iconView.image = UIImage(systemName: "slider.horizontal.3")
    iconView.tintColor = UIColor(red: 0.84, green: 0.10, blue: 0.13, alpha: 1)
    iconView.contentMode = .scaleAspectFit
    addSubview(iconView)

    NSLayoutConstraint.activate([
      iconView.centerXAnchor.constraint(equalTo: centerXAnchor),
      iconView.centerYAnchor.constraint(equalTo: centerYAnchor),
      iconView.widthAnchor.constraint(equalToConstant: 21),
      iconView.heightAnchor.constraint(equalToConstant: 21),
    ])

    layer.shadowColor = UIColor.black.cgColor
    layer.shadowOpacity = 0.14
    layer.shadowRadius = 14
    layer.shadowOffset = CGSize(width: 0, height: 6)

    addTarget(self, action: #selector(openConfig), for: .touchUpInside)
    syncState()
  }

  private func syncState() {
    isEnabled = !disabled
    alpha = disabled ? 0.45 : 1
  }

  @objc private func openConfig() {
    guard !disabled, let viewController = findViewController() else {
      return
    }

    let configController = KiniPoolConfigViewController(
      titleText: String(title),
      doneTitle: String(doneTitle),
      doublesTitle: String(doublesTitle),
      triplesTitle: String(triplesTitle),
      e8Title: String(e8Title),
      doubles: doubles.intValue,
      triples: triples.intValue,
      elige8: elige8,
      minDoubles: minDoubles.intValue,
      maxDoubles: maxDoubles.intValue,
      minTriples: minTriples.intValue,
      maxTriples: maxTriples.intValue
    )

    configController.onChange = { [weak self] doubles, triples, elige8 in
      self?.doubles = NSNumber(value: doubles)
      self?.triples = NSNumber(value: triples)
      self?.elige8 = elige8
      self?.onChange?([
        "doubles": doubles,
        "triples": triples,
        "elige8": elige8,
      ])
    }

    configController.modalPresentationStyle = .pageSheet
    if #available(iOS 15.0, *) {
      if let sheet = configController.sheetPresentationController {
        sheet.detents = [.medium()]
        sheet.prefersGrabberVisible = true
        sheet.preferredCornerRadius = 24
      }
    }

    viewController.present(configController, animated: true)
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

private final class KiniPoolConfigViewController: UIViewController {
  var onChange: ((Int, Int, Bool) -> Void)?

  private let doneTitle: String
  private let doublesTitle: String
  private let triplesTitle: String
  private let e8Title: String
  private let titleText: String
  private let maxDoubles: Int
  private let maxTriples: Int
  private let minDoubles: Int
  private let minTriples: Int

  private var currentDoubles: Int
  private var currentTriples: Int
  private var currentElige8: Bool

  private let doublesValueLabel = UILabel()
  private let triplesValueLabel = UILabel()

  init(
    titleText: String,
    doneTitle: String,
    doublesTitle: String,
    triplesTitle: String,
    e8Title: String,
    doubles: Int,
    triples: Int,
    elige8: Bool,
    minDoubles: Int,
    maxDoubles: Int,
    minTriples: Int,
    maxTriples: Int
  ) {
    self.titleText = titleText
    self.doneTitle = doneTitle
    self.doublesTitle = doublesTitle
    self.triplesTitle = triplesTitle
    self.e8Title = e8Title
    self.currentDoubles = min(max(doubles, minDoubles), maxDoubles)
    self.currentTriples = min(max(triples, minTriples), maxTriples)
    self.currentElige8 = elige8
    self.minDoubles = minDoubles
    self.maxDoubles = maxDoubles
    self.minTriples = minTriples
    self.maxTriples = maxTriples
    super.init(nibName: nil, bundle: nil)
  }

  required init?(coder: NSCoder) {
    fatalError("init(coder:) has not been implemented")
  }

  override func viewDidLoad() {
    super.viewDidLoad()
    view.backgroundColor = .systemGroupedBackground
    buildView()
  }

  private func buildView() {
    let content = UIStackView()
    content.axis = .vertical
    content.spacing = 18
    content.translatesAutoresizingMaskIntoConstraints = false
    view.addSubview(content)

    let header = UIStackView()
    header.axis = .horizontal
    header.alignment = .center
    header.spacing = 12

    let titleLabel = UILabel()
    titleLabel.text = titleText
    titleLabel.font = .systemFont(ofSize: 20, weight: .bold)
    titleLabel.textColor = .label

    let doneButton = UIButton(type: .system)
    doneButton.setTitle(doneTitle, for: .normal)
    doneButton.titleLabel?.font = .systemFont(ofSize: 17, weight: .semibold)
    doneButton.addTarget(self, action: #selector(close), for: .touchUpInside)

    header.addArrangedSubview(titleLabel)
    header.addArrangedSubview(UIView())
    header.addArrangedSubview(doneButton)
    content.addArrangedSubview(header)

    let rows = UIStackView()
    rows.axis = .vertical
    rows.spacing = 1
    rows.layer.cornerRadius = 14
    rows.clipsToBounds = true
    rows.backgroundColor = .secondarySystemGroupedBackground
    content.addArrangedSubview(rows)

    rows.addArrangedSubview(stepperRow(
      title: doublesTitle,
      valueLabel: doublesValueLabel,
      value: currentDoubles,
      minValue: minDoubles,
      maxValue: maxDoubles,
      action: #selector(doublesChanged(_:))
    ))
    rows.addArrangedSubview(separator())
    rows.addArrangedSubview(stepperRow(
      title: triplesTitle,
      valueLabel: triplesValueLabel,
      value: currentTriples,
      minValue: minTriples,
      maxValue: maxTriples,
      action: #selector(triplesChanged(_:))
    ))
    rows.addArrangedSubview(separator())
    rows.addArrangedSubview(switchRow())

    NSLayoutConstraint.activate([
      content.leadingAnchor.constraint(equalTo: view.leadingAnchor, constant: 20),
      content.trailingAnchor.constraint(equalTo: view.trailingAnchor, constant: -20),
      content.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor, constant: 20),
    ])
  }

  private func stepperRow(
    title: String,
    valueLabel: UILabel,
    value: Int,
    minValue: Int,
    maxValue: Int,
    action: Selector
  ) -> UIView {
    let row = UIStackView()
    row.axis = .horizontal
    row.alignment = .center
    row.spacing = 12
    row.layoutMargins = UIEdgeInsets(top: 12, left: 16, bottom: 12, right: 16)
    row.isLayoutMarginsRelativeArrangement = true

    let titleLabel = UILabel()
    titleLabel.text = title
    titleLabel.font = .systemFont(ofSize: 17, weight: .semibold)
    titleLabel.textColor = .label

    valueLabel.text = "\(value)"
    valueLabel.font = .monospacedDigitSystemFont(ofSize: 17, weight: .semibold)
    valueLabel.textAlignment = .right
    valueLabel.textColor = .secondaryLabel
    valueLabel.widthAnchor.constraint(equalToConstant: 32).isActive = true

    let stepper = UIStepper()
    stepper.minimumValue = Double(minValue)
    stepper.maximumValue = Double(maxValue)
    stepper.stepValue = 1
    stepper.value = Double(value)
    stepper.addTarget(self, action: action, for: .valueChanged)

    row.addArrangedSubview(titleLabel)
    row.addArrangedSubview(UIView())
    row.addArrangedSubview(valueLabel)
    row.addArrangedSubview(stepper)
    return row
  }

  private func switchRow() -> UIView {
    let row = UIStackView()
    row.axis = .horizontal
    row.alignment = .center
    row.spacing = 12
    row.layoutMargins = UIEdgeInsets(top: 12, left: 16, bottom: 12, right: 16)
    row.isLayoutMarginsRelativeArrangement = true

    let titleLabel = UILabel()
    titleLabel.text = e8Title
    titleLabel.font = .systemFont(ofSize: 17, weight: .semibold)
    titleLabel.textColor = .label

    let control = UISwitch()
    control.onTintColor = UIColor(red: 0.04, green: 0.44, blue: 0.71, alpha: 1)
    control.isOn = currentElige8
    control.addTarget(self, action: #selector(elige8Changed(_:)), for: .valueChanged)

    row.addArrangedSubview(titleLabel)
    row.addArrangedSubview(UIView())
    row.addArrangedSubview(control)
    return row
  }

  private func separator() -> UIView {
    let view = UIView()
    view.backgroundColor = .separator
    view.heightAnchor.constraint(equalToConstant: 1 / UIScreen.main.scale).isActive = true
    return view
  }

  @objc private func doublesChanged(_ sender: UIStepper) {
    currentDoubles = Int(sender.value)
    doublesValueLabel.text = "\(currentDoubles)"
    emitChange()
  }

  @objc private func triplesChanged(_ sender: UIStepper) {
    currentTriples = Int(sender.value)
    triplesValueLabel.text = "\(currentTriples)"
    emitChange()
  }

  @objc private func elige8Changed(_ sender: UISwitch) {
    currentElige8 = sender.isOn
    emitChange()
  }

  @objc private func close() {
    dismiss(animated: true)
  }

  private func emitChange() {
    onChange?(currentDoubles, currentTriples, currentElige8)
  }
}
