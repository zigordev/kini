package com.anonymous.kini.nativecontrols

import android.widget.NumberPicker
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactContext
import com.facebook.react.uimanager.SimpleViewManager
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.annotations.ReactProp
import com.facebook.react.uimanager.events.RCTEventEmitter

class KiniNativeStepperManager : SimpleViewManager<NumberPicker>() {
  override fun getName(): String = "KiniNativeStepper"

  override fun createViewInstance(reactContext: ThemedReactContext): NumberPicker =
    NumberPicker(reactContext).apply {
      minValue = 0
      maxValue = 8
      value = 0
      wrapSelectorWheel = false
      descendantFocusability = NumberPicker.FOCUS_BLOCK_DESCENDANTS
      setOnValueChangedListener { picker, _, newValue ->
        val event = Arguments.createMap().apply {
          putDouble("value", newValue.toDouble())
        }
        (picker.context as ReactContext)
          .getJSModule(RCTEventEmitter::class.java)
          .receiveEvent(picker.id, "topChange", event)
      }
    }

  override fun getExportedCustomBubblingEventTypeConstants(): Map<String, Any> =
    mapOf(
      "topChange" to mapOf(
        "phasedRegistrationNames" to mapOf(
          "bubbled" to "onChange",
        ),
      ),
    )

  @ReactProp(name = "disabled", defaultBoolean = false)
  fun setDisabled(view: NumberPicker, disabled: Boolean) {
    view.isEnabled = !disabled
    view.alpha = if (disabled) 0.45f else 1f
  }

  @ReactProp(name = "maximumValue", defaultInt = 8)
  fun setMaximumValue(view: NumberPicker, maximumValue: Int) {
    view.maxValue = maximumValue
    view.value = view.value.coerceIn(view.minValue, view.maxValue)
  }

  @ReactProp(name = "minimumValue", defaultInt = 0)
  fun setMinimumValue(view: NumberPicker, minimumValue: Int) {
    view.minValue = minimumValue
    view.value = view.value.coerceIn(view.minValue, view.maxValue)
  }

  @ReactProp(name = "step", defaultInt = 1)
  fun setStep(view: NumberPicker, step: Int) {
    // Android's framework NumberPicker advances in single displayed values.
    // The app currently uses step=1, so this prop is kept for JS parity.
  }

  @ReactProp(name = "value", defaultInt = 0)
  fun setValue(view: NumberPicker, value: Int) {
    view.value = value.coerceIn(view.minValue, view.maxValue)
  }
}
