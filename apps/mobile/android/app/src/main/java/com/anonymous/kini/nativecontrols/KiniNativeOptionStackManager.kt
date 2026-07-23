package com.anonymous.kini.nativecontrols

import android.content.res.ColorStateList
import android.graphics.Color
import android.graphics.Typeface
import android.view.Gravity
import android.widget.Button
import android.widget.LinearLayout
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactContext
import com.facebook.react.uimanager.SimpleViewManager
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.annotations.ReactProp
import com.facebook.react.uimanager.events.RCTEventEmitter
import org.json.JSONArray

class KiniNativeOptionStackManager : SimpleViewManager<KiniNativeOptionStackView>() {
  override fun getName(): String = "KiniNativeOptionStack"

  override fun createViewInstance(
    reactContext: ThemedReactContext,
  ): KiniNativeOptionStackView = KiniNativeOptionStackView(reactContext)

  override fun getExportedCustomBubblingEventTypeConstants(): Map<String, Any> =
    mapOf(
      "topSelect" to mapOf(
        "phasedRegistrationNames" to mapOf(
          "bubbled" to "onSelect",
        ),
      ),
    )

  @ReactProp(name = "disabled", defaultBoolean = false)
  fun setDisabled(view: KiniNativeOptionStackView, disabled: Boolean) {
    view.disabled = disabled
    view.render()
  }

  @ReactProp(name = "optionsJson")
  fun setOptionsJson(view: KiniNativeOptionStackView, value: String?) {
    view.optionsJson = value.orEmpty()
    view.render()
  }

  @ReactProp(name = "outcome")
  fun setOutcome(view: KiniNativeOptionStackView, value: String?) {
    view.outcome = value ?: "neutral"
    view.render()
  }

  @ReactProp(name = "selectedOptionsJson")
  fun setSelectedOptionsJson(view: KiniNativeOptionStackView, value: String?) {
    view.selectedOptionsJson = value.orEmpty()
    view.render()
  }
}

class KiniNativeOptionStackView(
  context: ThemedReactContext,
) : LinearLayout(context) {
  var disabled: Boolean = false
  var optionsJson: String = "[]"
  var outcome: String = "neutral"
  var selectedOptionsJson: String = "[]"

  init {
    orientation = HORIZONTAL
    gravity = Gravity.CENTER
  }

  fun render() {
    removeAllViews()
    val options = parseArray(optionsJson)
    val selectedOptions = parseArray(selectedOptionsJson).toSet()

    options.forEachIndexed { index, option ->
      val button = Button(context).apply {
        text = option
        isAllCaps = false
        minWidth = 0
        minHeight = 0
        includeFontPadding = false
        gravity = Gravity.CENTER
        typeface = Typeface.DEFAULT_BOLD
        textSize = 15f
        isEnabled = !disabled
        alpha = if (disabled) 0.65f else 1f
        setPadding(dp(2), 0, dp(2), 0)
        applySelectedState(selectedOptions.contains(option))
        setOnClickListener {
          if (!disabled) {
            emitSelect(option)
          }
        }
      }
      val params = LayoutParams(dp(40), dp(40)).apply {
        if (index < options.lastIndex) {
          marginEnd = dp(4)
        }
      }
      addView(button, params)
    }
  }

  private fun Button.applySelectedState(selected: Boolean) {
    if (selected) {
      val color = when (outcome) {
        "success" -> Color.rgb(21, 127, 59)
        "failure" -> Color.rgb(180, 35, 24)
        else -> Color.rgb(117, 117, 117)
      }
      backgroundTintList = ColorStateList.valueOf(color)
      setTextColor(Color.WHITE)
    } else {
      backgroundTintList = null
      setTextColor(Color.rgb(37, 49, 63))
    }
  }

  private fun emitSelect(value: String) {
    val event = Arguments.createMap().apply {
      putString("value", value)
    }
    (context as ReactContext)
      .getJSModule(RCTEventEmitter::class.java)
      .receiveEvent(id, "topSelect", event)
  }

  private fun parseArray(source: String): List<String> {
    if (source.isBlank()) {
      return emptyList()
    }
    return try {
      val array = JSONArray(source)
      List(array.length()) { index -> array.optString(index) }
        .filter { it.isNotBlank() }
    } catch (_: Exception) {
      emptyList()
    }
  }

  private fun dp(value: Int): Int =
    (value * resources.displayMetrics.density).toInt()
}
