#import <React/RCTViewManager.h>

@interface RCT_EXTERN_MODULE(KiniNativeBottomNavManager, RCTViewManager)

RCT_EXPORT_VIEW_PROPERTY(availablePoolsTitle, NSString)
RCT_EXPORT_VIEW_PROPERTY(onSelect, RCTBubblingEventBlock)
RCT_EXPORT_VIEW_PROPERTY(poolsTitle, NSString)
RCT_EXPORT_VIEW_PROPERTY(profileTitle, NSString)
RCT_EXPORT_VIEW_PROPERTY(selectedTab, NSString)
RCT_EXPORT_VIEW_PROPERTY(statsTitle, NSString)

@end
