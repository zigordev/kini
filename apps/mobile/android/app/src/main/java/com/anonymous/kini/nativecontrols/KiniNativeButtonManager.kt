package com.anonymous.kini.nativecontrols

import android.graphics.Color
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.widget.Button
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactContext
import com.facebook.react.uimanager.SimpleViewManager
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.annotations.ReactProp
import com.facebook.react.uimanager.events.RCTEventEmitter

class KiniNativeButtonManager : SimpleViewManager<Button>() {
  override fun getName(): String = "KiniNativeButton"

  override fun createViewInstance(reactContext: ThemedReactContext): Button =
    Button(reactContext).apply {
      isAllCaps = false
      minHeight = 0
      minWidth = 0
      setPadding(28, 0, 28, 0)
      typeface = Typeface.DEFAULT_BOLD
      setOnClickListener { view ->
        val event = Arguments.createMap()
        (view.context as ReactContext)
          .getJSModule(RCTEventEmitter::class.java)
          .receiveEvent(view.id, "topPress", event)
      }
      applyVariant("primary")
    }

  override fun getExportedCustomBubblingEventTypeConstants(): Map<String, Any> =
    mapOf(
      "topPress" to mapOf(
        "phasedRegistrationNames" to mapOf(
          "bubbled" to "onPress",
        ),
      ),
    )

  @ReactProp(name = "disabled", defaultBoolean = false)
  fun setDisabled(view: Button, disabled: Boolean) {
    view.isEnabled = !disabled
    view.alpha = if (disabled) 0.45f else 1f
  }

  @ReactProp(name = "title")
  fun setTitle(view: Button, title: String?) {
    view.text = title.orEmpty()
  }

  @ReactProp(name = "variant")
  fun setVariant(view: Button, variant: String?) {
    view.applyVariant(variant ?: "primary")
  }

  private fun Button.applyVariant(variant: String) {
    val background = GradientDrawable().apply {
      cornerRadius = 18f
      when (variant) {
        "secondary" -> {
          setColor(Color.WHITE)
          setStroke(2, Color.rgb(216, 225, 225))
        }
        "destructive" -> {
          setColor(Color.rgb(180, 35, 24))
          setStroke(0, Color.TRANSPARENT)
        }
        else -> {
          setColor(Color.rgb(215, 25, 32))
          setStroke(0, Color.TRANSPARENT)
        }
      }
    }
    this.background = background
    setTextColor(
      if (variant == "secondary") Color.rgb(23, 32, 42) else Color.WHITE,
    )
  }
}
