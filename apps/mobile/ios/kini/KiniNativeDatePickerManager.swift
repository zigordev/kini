import React
import UIKit

@objc(KiniNativeDatePickerManager)
final class KiniNativeDatePickerManager: RCTViewManager {
  override func view() -> UIView! {
    KiniNativeDatePickerView()
  }

  override static func requiresMainQueueSetup() -> Bool {
    true
  }
}
