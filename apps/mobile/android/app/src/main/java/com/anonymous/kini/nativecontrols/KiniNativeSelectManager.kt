package com.anonymous.kini.nativecontrols

import android.app.AlertDialog
import android.content.Context
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
import org.json.JSONArray

class KiniNativeSelectManager : SimpleViewManager<KiniSelectButton>() {
  override fun getName(): String = "KiniNativeSelect"

  override fun createViewInstance(reactContext: ThemedReactContext): KiniSelectButton =
    KiniSelectButton(reactContext)

  override fun getExportedCustomBubblingEventTypeConstants(): Map<String, Any> =
    mapOf(
      "topChange" to mapOf(
        "phasedRegistrationNames" to mapOf(
          "bubbled" to "onChange",
        ),
      ),
    )

  @ReactProp(name = "appearance")
  fun setAppearance(view: KiniSelectButton, appearance: String?) {
    view.appearance = appearance.orEmpty()
    view.applyAppearance()
  }

  @ReactProp(name = "disabled", defaultBoolean = false)
  fun setDisabled(view: KiniSelectButton, disabled: Boolean) {
    view.isEnabled = !disabled
    view.alpha = if (disabled) 0.55f else 1f
  }

  @ReactProp(name = "optionsJson")
  fun setOptionsJson(view: KiniSelectButton, optionsJson: String?) {
    view.setOptions(optionsJson.orEmpty())
  }

  @ReactProp(name = "placeholder")
  fun setPlaceholder(view: KiniSelectButton, placeholder: String?) {
    view.placeholder = placeholder.orEmpty()
    view.syncTitle()
  }

  @ReactProp(name = "selectedValue")
  fun setSelectedValue(view: KiniSelectButton, selectedValue: String?) {
    view.selectedValue = selectedValue.orEmpty()
    view.syncTitle()
  }

  @ReactProp(name = "title")
  fun setTitle(view: KiniSelectButton, title: String?) {
    view.dialogTitle = title.orEmpty()
  }
}

class KiniSelectButton(context: Context) : Button(context) {
  var appearance: String = "field"
  var dialogTitle: String = ""
  var placeholder: String = ""
  var selectedValue: String = ""
  private var options: List<SelectOption> = emptyList()

  init {
    isAllCaps = false
    applyAppearance()
    setOnClickListener { openDialog() }
  }

  fun applyAppearance() {
    typeface = Typeface.DEFAULT_BOLD
    if (appearance == "primary") {
      setTextColor(Color.WHITE)
      gravity = android.view.Gravity.CENTER
      setPadding(28, 0, 28, 0)
      background = GradientDrawable().apply {
        cornerRadius = 18f
        setColor(Color.rgb(215, 25, 32))
      }
      return
    }

    setTextColor(Color.rgb(23, 32, 42))
    gravity = android.view.Gravity.CENTER_VERTICAL or android.view.Gravity.START
    setPadding(28, 0, 28, 0)
    background = GradientDrawable().apply {
      cornerRadius = 18f
      setColor(Color.WHITE)
      setStroke(2, Color.rgb(216, 225, 225))
    }
  }

  fun setOptions(optionsJson: String) {
    options = parseOptions(optionsJson)
    syncTitle()
  }

  fun syncTitle() {
    text = options.firstOrNull { it.value == selectedValue }?.label ?: placeholder
  }

  private fun openDialog() {
    if (options.isEmpty()) {
      return
    }

    AlertDialog.Builder(context)
      .setTitle(dialogTitle)
      .setItems(options.map { it.label }.toTypedArray()) { _, which ->
        val option = options[which]
        selectedValue = option.value
        syncTitle()
        val event = Arguments.createMap().apply {
          putString("value", option.value)
        }
        (context as ReactContext)
          .getJSModule(RCTEventEmitter::class.java)
          .receiveEvent(id, "topChange", event)
      }
      .show()
  }

  private fun parseOptions(optionsJson: String): List<SelectOption> {
    return try {
      val array = JSONArray(optionsJson)
      List(array.length()) { index ->
        val item = array.getJSONObject(index)
        SelectOption(
          label = item.optString("label"),
          value = item.optString("value"),
        )
      }
    } catch (_: Exception) {
      emptyList()
    }
  }

  private data class SelectOption(
    val label: String,
    val value: String,
  )
}
