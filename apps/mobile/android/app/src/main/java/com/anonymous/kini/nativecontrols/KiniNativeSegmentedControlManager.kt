package com.anonymous.kini.nativecontrols

import android.content.Context
import android.graphics.Color
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.util.TypedValue
import android.view.Gravity
import android.widget.LinearLayout
import android.widget.TextView
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactContext
import com.facebook.react.uimanager.SimpleViewManager
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.annotations.ReactProp
import com.facebook.react.uimanager.events.RCTEventEmitter
import org.json.JSONArray

class KiniNativeSegmentedControlManager : SimpleViewManager<KiniSegmentedControlView>() {
  override fun getName(): String = "KiniNativeSegmentedControl"

  override fun createViewInstance(reactContext: ThemedReactContext): KiniSegmentedControlView =
    KiniSegmentedControlView(reactContext)

  override fun getExportedCustomBubblingEventTypeConstants(): Map<String, Any> =
    mapOf(
      "topChange" to mapOf(
        "phasedRegistrationNames" to mapOf(
          "bubbled" to "onChange",
        ),
      ),
    )

  @ReactProp(name = "disabled", defaultBoolean = false)
  fun setDisabled(view: KiniSegmentedControlView, disabled: Boolean) {
    view.isEnabled = !disabled
    view.alpha = if (disabled) 0.55f else 1f
  }

  @ReactProp(name = "optionsJson")
  fun setOptionsJson(view: KiniSegmentedControlView, optionsJson: String?) {
    view.setOptions(optionsJson.orEmpty())
  }

  @ReactProp(name = "selectedValue")
  fun setSelectedValue(view: KiniSegmentedControlView, selectedValue: String?) {
    view.selectedValue = selectedValue.orEmpty()
    view.syncSelection()
  }
}

class KiniSegmentedControlView(context: Context) : LinearLayout(context) {
  var selectedValue: String = ""
  private var options: List<SegmentedOption> = emptyList()

  init {
    orientation = HORIZONTAL
    gravity = Gravity.CENTER
    background = GradientDrawable().apply {
      cornerRadius = dp(8).toFloat()
      setColor(Color.rgb(241, 243, 245))
      setStroke(dp(1), Color.rgb(216, 225, 225))
    }
    setPadding(dp(2), dp(2), dp(2), dp(2))
  }

  fun setOptions(optionsJson: String) {
    options = parseOptions(optionsJson)
    rebuildSegments()
  }

  fun syncSelection() {
    for (index in 0 until childCount) {
      val child = getChildAt(index) as? TextView ?: continue
      val selected = options.getOrNull(index)?.value == selectedValue
      child.setTextColor(if (selected) Color.WHITE else Color.rgb(23, 32, 42))
      child.typeface = if (selected) Typeface.DEFAULT_BOLD else Typeface.DEFAULT
      child.background = if (selected) {
        GradientDrawable().apply {
          cornerRadius = dp(6).toFloat()
          setColor(Color.rgb(215, 25, 32))
        }
      } else {
        null
      }
    }
  }

  private fun rebuildSegments() {
    removeAllViews()
    options.forEach { option ->
      val segment = TextView(context).apply {
        gravity = Gravity.CENTER
        text = option.label
        textSize = 14f
        maxLines = 1
        includeFontPadding = false
        setPadding(dp(10), 0, dp(10), 0)
        setOnClickListener {
          selectedValue = option.value
          syncSelection()
          val event = Arguments.createMap().apply {
            putString("value", option.value)
          }
          (context as ReactContext)
            .getJSModule(RCTEventEmitter::class.java)
            .receiveEvent(id, "topChange", event)
        }
      }
      addView(segment, LayoutParams(0, LayoutParams.MATCH_PARENT, 1f))
    }
    syncSelection()
  }

  private fun parseOptions(optionsJson: String): List<SegmentedOption> {
    return try {
      val array = JSONArray(optionsJson)
      List(array.length()) { index ->
        val item = array.getJSONObject(index)
        SegmentedOption(
          label = item.optString("label"),
          value = item.optString("value"),
        )
      }
    } catch (_: Exception) {
      emptyList()
    }
  }

  private fun dp(value: Int): Int =
    TypedValue.applyDimension(
      TypedValue.COMPLEX_UNIT_DIP,
      value.toFloat(),
      resources.displayMetrics,
    ).toInt()

  private data class SegmentedOption(
    val label: String,
    val value: String,
  )
}
