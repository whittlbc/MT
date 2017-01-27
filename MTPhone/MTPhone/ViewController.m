
//  ViewController.m
//  SimpleControl
//
//  Created by Cheong on 7/11/12.
//  Copyright (c) 2012 RedBearLab. All rights reserved.
//

#import "ViewController.h"

@interface ViewController ()

@property (nonatomic) BOOL connectedToZero;
@property (nonatomic) BOOL flippedUp;
@property (nonatomic, strong) NSNumber *rssi;
@property (nonatomic, strong) UIView *circle;
@property (nonatomic, strong) UIImageView *playBtn;
@property (nonatomic) CGPoint playBtnCenter;
@property (nonatomic) CGPoint pauseBtnCenter;
@property (nonatomic) BOOL playing;
@property (nonatomic, strong) UILabel *rssiLabel;
@property (nonatomic) NSUInteger count;

@end

@implementation ViewController

@synthesize ble;

- (void)viewDidLoad {
    [super viewDidLoad];
    
    self.view.backgroundColor = [UIColor colorWithRed:20/255.0f green:20/255.0f blue:20/255.0f alpha:1.0f];
    
    self.connectedToZero = NO;
    self.flippedUp = NO;
    self.count = 0;
    
    ble = [[BLE alloc] init];
    [ble controlSetup];
    ble.delegate = self;

    [NSTimer scheduledTimerWithTimeInterval:(float)1.0 target:self selector:@selector(autoScan) userInfo:nil repeats:NO];
    
    // PLAY-PAUSE CIRCLE
    int circleSideLenth = 0.11*self.view.bounds.size.height;
    self.circle = [[UIView alloc] initWithFrame:CGRectMake(0, 0, circleSideLenth, circleSideLenth)];
    self.circle.center = self.view.center;
    self.circle.backgroundColor = [UIColor clearColor];
    self.circle.layer.borderColor = [UIColor whiteColor].CGColor;
    self.circle.layer.borderWidth = 1.0f;
    self.circle.layer.cornerRadius = 0.5*circleSideLenth;
    self.circle.layer.masksToBounds = YES;
    [self.view addSubview:self.circle];
    
    
    // PLAY BTN
    int playBtnSideLength = 0.6*circleSideLenth;
    self.playBtn = [[UIImageView alloc] initWithImage:[UIImage imageNamed:@"pause.png"]];
    self.playBtn.image = [self.playBtn.image imageWithRenderingMode:UIImageRenderingModeAlwaysTemplate];
    [self.playBtn setTintColor:[UIColor whiteColor]];
    [self.playBtn setFrame:CGRectMake(0, 0, playBtnSideLength, playBtnSideLength)];
    self.playBtn.center = CGPointMake(self.circle.center.x+3, self.circle.center.y);
    [self.view addSubview:self.playBtn];
    self.playBtnCenter = self.playBtn.center;
    self.pauseBtnCenter = CGPointMake(self.playBtn.center.x-3, self.playBtn.center.y);
    self.playBtn.center = self.pauseBtnCenter;
    self.playing = YES;
    
    
    // RSSI TITLE
    int titleLength = 0.5*self.view.bounds.size.width;
    int titleHeight = 0.07*self.view.bounds.size.height;
    UILabel *title = [[UILabel alloc] initWithFrame:CGRectMake(0.5*(self.view.bounds.size.width-titleLength), 0.165*self.view.bounds.size.height, titleLength, titleHeight)];
    [title setTextColor:[UIColor whiteColor]];
    [title setBackgroundColor:[UIColor clearColor]];
    [title setFont:[UIFont fontWithName: @"Helvetica-Bold" size: 22.0f]];
    title.text = @"RSSI";
    title.textAlignment = NSTextAlignmentCenter;
    title.numberOfLines = 1;
    [self.view addSubview:title];
    
    
    // RSSI VALUE
    self.rssiLabel = [[UILabel alloc] initWithFrame:CGRectMake(0.5*(self.view.bounds.size.width-titleLength), 0.16*self.view.bounds.size.height+titleHeight, titleLength, titleHeight)];
    [self.rssiLabel setTextColor:[UIColor whiteColor]];
    [self.rssiLabel setBackgroundColor:[UIColor clearColor]];
    [self.rssiLabel setFont:[UIFont fontWithName: @"Helvetica" size: 20.0f]];
    self.rssiLabel.text = @"--";
    self.rssiLabel.textAlignment = NSTextAlignmentCenter;
    self.rssiLabel.numberOfLines = 1;
    [self.view addSubview:self.rssiLabel];
    
    
    UITapGestureRecognizer *circleTap = [[UITapGestureRecognizer alloc] initWithTarget:self action:@selector(toggle)];
    [self.circle addGestureRecognizer:circleTap];
    UITapGestureRecognizer *playBtnTap = [[UITapGestureRecognizer alloc] initWithTarget:self action:@selector(toggle)];
    [self.playBtn addGestureRecognizer:playBtnTap];
}

- (void)didReceiveMemoryWarning {
    
    [super didReceiveMemoryWarning];
}

#pragma mark - BLE delegate

NSTimer *rssiTimer;

- (void)bleDidDisconnect {
    
    NSLog(@"->Disconnected");
    
    self.connectedToZero = NO;
    
    [rssiTimer invalidate];
    
}

// When RSSI is changed, this will be called
-(void) bleDidUpdateRSSI:(NSNumber *) rssi
{
    self.rssi = rssi;
    int intRSSI = [self.rssi intValue];
    intRSSI = -1*intRSSI;
    self.rssiLabel.text = [NSString stringWithFormat:@"%d", intRSSI];
    
    // if sign IS flipped up and RSSI > 80 and sign hasn't been flipped down before
    if  (self.flippedUp && intRSSI > 80 && self.count == 1){
    
        self.flippedUp = NO;
        self.count++;

        // send post to server to initialize PubNub message to be sent to iPad app, resulting in stopped music
        [self sendPost:@"stopMusic"];
        
        // reset motor back to original position
        [self resetMotor];
        
    }
    
    // if sign is NOT flipped up and RSSI <= 80 and sign hasn't been flipped up before
    else if (!self.flippedUp && intRSSI <= 80 && self.count == 0){

        // send post to server to initialize PubNub message to be sent to iPad app, resulting in played music
        [self sendPost:@"playMusic"];
        
        UInt8 buf[3] = {0x02, 0x00, 0x00};
        buf[1] = 255;
        buf[2] = 0;
        
        // instantiate data object with 255 value to be sent via BLE Shield for PWM
        NSData *data = [[NSData alloc] initWithBytes:buf length:3];
        [ble write:data];
        
        // call function to send 0 value to BLE Shield for PWM, stopping motor in flipped up position, after 0.7 seconds
        [NSTimer scheduledTimerWithTimeInterval:(float)0.7 target:self selector:@selector(stopMotor) userInfo:nil repeats:NO];
        
        self.flippedUp = YES;
        self.count++;
        
    }
    
}

-(void) readRSSITimer:(NSTimer *)timer
{
    [ble readRSSI];
    
}

-(void) bleDidConnect {
    
    NSLog(@"->Connected");
    self.connectedToZero = YES;
    rssiTimer = [NSTimer scheduledTimerWithTimeInterval:(float)0.25 target:self selector:@selector(readRSSITimer:) userInfo:nil repeats:YES];
}

-(void)stopMotor {
    
    UInt8 buf[3] = {0x02, 0x00, 0x00};
    
    buf[1] = 0;
    buf[2] = 0;
    
    NSData *data = [[NSData alloc] initWithBytes:buf length:3];
    [ble write:data];
    
}

// When data is comming, this will be called
-(void) bleDidReceiveData:(unsigned char *)data length:(int)length
{
    NSLog(@"Length: %d", length);
    
    // parse data, all commands are in 3-byte
    for (int i = 0; i < length; i+=3){
        
        NSLog(@"0x%02X, 0x%02X, 0x%02X", data[i], data[i+1], data[i+2]);
        
    }
}


// Scan function to search for active BLE devices (called automatically upon viewDidLoad())
-(void)autoScan {
    
    if (ble.activePeripheral)
        if(ble.activePeripheral.state == CBPeripheralStateConnected)
        {
            [[ble CM] cancelPeripheralConnection:[ble activePeripheral]];
            return;
        }
    
    if (ble.peripherals)
        ble.peripherals = nil;
    
    [ble findBLEPeripherals:2];
    
    // wait 2 seconds for app to find devices this soon after application launch, then call connectionTimer()
    [NSTimer scheduledTimerWithTimeInterval:(float)2.0 target:self selector:@selector(connectionTimer:) userInfo:nil repeats:NO];
    
}


-(void) connectionTimer:(NSTimer *)timer {
    
    // if not already connected to the element at the 0th index of the BLE devices array - which is our BLE Shield
    if (!self.connectedToZero){
        
        // Check to make sure BLE devices exist peripherally
        if (ble.peripherals.count > 0){
            
            // get the uuid of the 0th device
            NSUUID *beaconID = [[ble.peripherals objectAtIndex:0] valueForKey:@"identifier"];
            
            // make sure this device is, in fact, the BLE Shield
            if ([beaconID.UUIDString isEqualToString:@"06BE6682-1430-D3C2-A9BA-C7FB71EAAAE1"]){
                
                // connect to the BLE Shield
                [ble connectPeripheral:[ble.peripherals objectAtIndex:0]];
            }
            
        }
        
        // continue scanning
        [self autoScan];
    }
    
}


-(void)resetMotor {
    
    UInt8 buf[3] = {0x02, 0x00, 0x00};
    
    buf[1] = 255;
    buf[2] = 0;
    
    NSData *data = [[NSData alloc] initWithBytes:buf length:3];
    [ble write:data];
    
    [NSTimer scheduledTimerWithTimeInterval:(float)2.1 target:self selector:@selector(stopMotor) userInfo:nil repeats:NO];
    
}



-(void)toggle {
    
    [self sendPost:@"toggleMusic"];
    
    if (self.playing){
        
        self.playing = NO;
        self.playBtn.image = [UIImage imageNamed:@"play.png"];
        self.playBtn.image = [self.playBtn.image imageWithRenderingMode:UIImageRenderingModeAlwaysTemplate];
        [self.playBtn setTintColor:[UIColor whiteColor]];
        self.playBtn.center = self.playBtnCenter;
        
    }
    else {
        
        self.playing = YES;
        self.playBtn.image = [UIImage imageNamed:@"pause.png"];
        self.playBtn.image = [self.playBtn.image imageWithRenderingMode:UIImageRenderingModeAlwaysTemplate];
        [self.playBtn setTintColor:[UIColor whiteColor]];
        self.playBtn.center = self.pauseBtnCenter;
    }
}



-(void)sendPost:(NSString *)channel {
    
    NSArray *keys = [NSArray arrayWithObjects:@"channel", nil];
    
    NSArray *objects = [NSArray arrayWithObjects:channel, nil];
    
    NSDictionary *jsonDictionary = [NSDictionary dictionaryWithObjects:objects forKeys:keys];
    
    NSData *jsonData;
    NSString *jsonString;
    if([NSJSONSerialization isValidJSONObject:jsonDictionary]){
        
        jsonData = [NSJSONSerialization dataWithJSONObject:jsonDictionary options:0 error:nil];
        
        jsonString = [[NSString alloc]initWithData:jsonData encoding:NSUTF8StringEncoding];
    }
    
    NSString *requestString = [NSString stringWithFormat:
                               @"http://54.69.227.168:8080/users/passPubNub"];
    
    NSURL *url = [NSURL URLWithString:requestString];
    NSMutableURLRequest *request = [NSMutableURLRequest requestWithURL:url];
    [request setHTTPMethod:@"POST"];
    [request setHTTPBody: jsonData];
    [request setValue:@"application/json" forHTTPHeaderField:@"Content-Type"];
    [request setValue:[NSString stringWithFormat:@"%lu", (unsigned long)[jsonData length]] forHTTPHeaderField:@"Content-Length"];
    
    NSURLSessionConfiguration* config = [NSURLSessionConfiguration defaultSessionConfiguration];
    NSURLSession* session = [NSURLSession sessionWithConfiguration:config];
    
    dispatch_async(dispatch_get_main_queue(), ^{
        
        NSURLSessionDataTask* dataTask = [session dataTaskWithRequest:request completionHandler:^(NSData *data, NSURLResponse *response, NSError *error) {
            if (error == nil) {
                
                NSLog(@"Successfully passed PubNub to server");
                
            }
            else {
                
                NSLog(@"Error passing PubNub");
            }
        }];
        
        NSLog(@"dataTask resume");

        [dataTask resume];
    });
}


@end
