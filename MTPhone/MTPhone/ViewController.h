//
//  ViewController.h
//  MTMotor
//
//  Created by Ben Whittle on 4/11/15.
//  Copyright (c) 2015 Ben Whittle. All rights reserved.
//

#import <UIKit/UIKit.h>
#import "BLE.h"


@interface ViewController : UIViewController <BLEDelegate>

@property (strong, nonatomic) BLE *ble;

-(void)autoScan;
-(void)stopMotor;
-(void)resetMotor;
-(void)toggle;
-(void)sendPost:(NSString *)channel;

@end

