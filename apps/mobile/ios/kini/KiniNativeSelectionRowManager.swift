import React
import UIKit

@objc(KiniNativeSelectionRowManager)
final class KiniNativeSelectionRowManager: RCTViewManager {
  override func view() -> UIView! {
    KiniNativeSelectionRowView()
  }

  override static func requiresMainQueueSetup() -> Bool {
    true
  }
}
