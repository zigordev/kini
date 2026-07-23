#import <React/RCTViewManager.h>

@interface RCT_EXTERN_MODULE(KiniNativeOptionStackManager, RCTViewManager)

RCT_EXPORT_VIEW_PROPERTY(disabled, BOOL)
RCT_EXPORT_VIEW_PROPERTY(onSelect, RCTBubblingEventBlock)
RCT_EXPORT_VIEW_PROPERTY(optionsJson, NSString)
RCT_EXPORT_VIEW_PROPERTY(outcome, NSString)
RCT_EXPORT_VIEW_PROPERTY(selectedOptionsJson, NSString)

@end
