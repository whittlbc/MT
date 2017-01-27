//
//  ViewController.m
//  MTMusic
//
//  Created by Ben Whittle on 4/11/15.
//  Copyright (c) 2015 Ben Whittle. All rights reserved.
//

#import "ViewController.h"
#import "AppDelegate.h"

static NSString * const kClientId = @"002d9d1f653c4421b1433ee50c82d061";


@interface ViewController ()

@property (nonatomic, strong) AppDelegate *appDelegate;
@property (nonatomic, strong) UIView *sptBtn;
@property (nonatomic, strong) UILabel *label;
@property (nonatomic) BOOL playing;
@property (nonatomic, strong) SPTAudioStreamingController *player;


@end


@implementation ViewController

- (void)viewDidLoad {
    [super viewDidLoad];
    
    self.appDelegate = (AppDelegate *)[[UIApplication sharedApplication] delegate];
    self.playing = NO;
    self.view.backgroundColor = [UIColor colorWithRed:20/255.0f green:20/255.0f blue:20/255.0f alpha:1.0f];
    
    
    // BTN
    int btnHeight = 70;
    int btnWidth =  350;
    self.sptBtn = [[UIView alloc] initWithFrame:CGRectMake(0, 0, btnWidth, btnHeight)];
    self.sptBtn.center = self.view.center;
    self.sptBtn.backgroundColor = [UIColor colorWithRed:124/255.0f green:192/255.0f blue:7/255.0f alpha:1.0f];
    self.sptBtn.layer.cornerRadius = 0.5*btnHeight;
    self.sptBtn.layer.masksToBounds = YES;
    [self.view addSubview:self.sptBtn];
    
    
    // TEXT
    self.label = [[UILabel alloc] initWithFrame:self.sptBtn.frame];
    self.label.center = self.sptBtn.center;
    [self.label setTextColor:[UIColor whiteColor]];
    [self.label setBackgroundColor:[UIColor clearColor]];
    self.label.font = [UIFont fontWithName: @"Helvetica" size: 22.0f];
    self.label.textAlignment = NSTextAlignmentCenter;
    self.label.text = @"Login with Spotify";
    [self.view addSubview:self.label];

    
    // TAPS
    UITapGestureRecognizer *btnTap = [[UITapGestureRecognizer alloc] initWithTarget:self action:@selector(login)];
    [self.sptBtn addGestureRecognizer:btnTap];
    UITapGestureRecognizer *textTap = [[UITapGestureRecognizer alloc] initWithTarget:self action:@selector(login)];
    [self.label addGestureRecognizer:textTap];
    
    
}

- (void)didReceiveMemoryWarning {
    [super didReceiveMemoryWarning];
}

-(void)viewWillAppear:(BOOL)animated {
    
    if ([self.appDelegate checkIfLoggedIn]){
        
        self.sptBtn.hidden = YES;
        self.sptBtn.userInteractionEnabled = NO;
        self.label.hidden = YES;
        self.label.userInteractionEnabled = NO;
    
    }
    else {
        
        self.sptBtn.hidden = NO;
        self.sptBtn.userInteractionEnabled = YES;
        self.label.hidden = NO;
        self.label.userInteractionEnabled = YES;
    }
}


-(void)login {
    
    [self.appDelegate loginWithSpotify];
}



-(void)playUsingSession:(SPTSession *)session trackURI:(id)trackURI {
    
    if (self.player == nil) {
        
        self.player = [[SPTAudioStreamingController alloc] initWithClientId:kClientId];
        self.player.playbackDelegate = self;
        
    }
    
    [self.player loginWithSession:session callback:^(NSError *error) {
        
        if (error != nil) {
            NSLog(@"*** Enabling playback got error: %@", error);
            return;
        }
        
        NSLog(@"Current Track URI:, %@", trackURI);
        
        [SPTRequest requestItemAtURI:[NSURL URLWithString:trackURI]
                         withSession:nil
                            callback:^(NSError *error, SPTTrack *track) {
                                
                                if (error != nil) {
                                    NSLog(@"*** Track lookup got error %@", error);
                                    return;
                                }
                                else {
                                    
                                    [self.player playTrackProvider:track callback:nil];
                                    self.playing = YES;

                                }
                            }];
    }];
    
}

-(void) hideBtnAfterLogin {
    
    self.sptBtn.hidden = YES;
    self.sptBtn.userInteractionEnabled = NO;
    self.label.hidden = YES;
    self.label.userInteractionEnabled = NO;
    
}


-(void)toggleMusic {
    
    [self.player setIsPlaying:!self.player.isPlaying callback:nil];
    
    if (self.playing){
        
        self.playing = NO;
    }
    else {
        
        self.playing = YES;
    }
}


-(void)stopMusic {
    
    if (self.playing){
        
        self.playing = NO;
        [self.player setIsPlaying:!self.player.isPlaying callback:nil];
        
    }
}

@end
