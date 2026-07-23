#import <React/RCTViewManager.h>

@interface RCT_EXTERN_MODULE(KiniNativeDatePickerManager, RCTViewManager)

RCT_EXPORT_VIEW_PROPERTY(disabled, BOOL)
RCT_EXPORT_VIEW_PROPERTY(label, NSString)
RCT_EXPORT_VIEW_PROPERTY(onChange, RCTBubblingEventBlock)
RCT_EXPORT_VIEW_PROPERTY(value, NSNumber)

@end
