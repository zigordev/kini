package com.anonymous.kini.nativecontrols

import android.content.res.ColorStateList
import android.graphics.Color
import android.widget.Switch
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactContext
import com.facebook.react.uimanager.SimpleViewManager
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.annotations.ReactProp
import com.facebook.react.uimanager.events.RCTEventEmitter

class KiniNativeSwitchManager : SimpleViewManager<Switch>() {
  override fun getName(): String = "KiniNativeSwitch"

  override fun createViewInstance(reactContext: ThemedReactContext): Switch =
    Switch(reactContext).apply {
      showText = false
      thumbTintList = ColorStateList.valueOf(Color.WHITE)
      trackTintList = ColorStateList(
        arrayOf(intArrayOf(android.R.attr.state_checked), intArrayOf()),
        intArrayOf(Color.rgb(10, 112, 181), Color.rgb(185, 199, 198)),
      )
      setOnCheckedChangeListener { view, isChecked ->
        val event = Arguments.createMap().apply {
          putBoolean("value", isChecked)
        }
        (view.context as ReactContext)
          .getJSModule(RCTEventEmitter::class.java)
          .receiveEvent(view.id, "topChange", event)
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

  @ReactProp(name = "checked", defaultBoolean = false)
  fun setChecked(view: Switch, checked: Boolean) {
    if (view.isChecked != checked) {
      view.isChecked = checked
    }
  }

  @ReactProp(name = "disabled", defaultBoolean = false)
  fun setDisabled(view: Switch, disabled: Boolean) {
    view.isEnabled = !disabled
    view.alpha = if (disabled) 0.55f else 1f
  }
}
