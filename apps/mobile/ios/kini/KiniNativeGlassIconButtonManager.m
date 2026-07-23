#import <React/RCTViewManager.h>

@interface RCT_EXTERN_MODULE(KiniNativeGlassIconButtonManager, RCTViewManager)

RCT_EXPORT_VIEW_PROPERTY(accessibilityLabelText, NSString)
RCT_EXPORT_VIEW_PROPERTY(disabled, BOOL)
RCT_EXPORT_VIEW_PROPERTY(iconName, NSString)
RCT_EXPORT_VIEW_PROPERTY(onPress, RCTBubblingEventBlock)

@end
