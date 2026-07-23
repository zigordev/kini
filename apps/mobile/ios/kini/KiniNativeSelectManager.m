#import <React/RCTViewManager.h>

@interface RCT_EXTERN_MODULE(KiniNativeSelectManager, RCTViewManager)

RCT_EXPORT_VIEW_PROPERTY(disabled, BOOL)
RCT_EXPORT_VIEW_PROPERTY(appearance, NSString)
RCT_EXPORT_VIEW_PROPERTY(onChange, RCTBubblingEventBlock)
RCT_EXPORT_VIEW_PROPERTY(optionsJson, NSString)
RCT_EXPORT_VIEW_PROPERTY(placeholder, NSString)
RCT_EXPORT_VIEW_PROPERTY(selectedValue, NSString)
RCT_EXPORT_VIEW_PROPERTY(title, NSString)

@end
