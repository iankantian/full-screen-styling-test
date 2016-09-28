function myApplication() {
    var vid = document.getElementById('myIcon_videoWrapper');

    // a mock instance object, similar to what the vendor uses:
    var instance = {
        adTitle: 'Video Ad Title!',
        adDuration: 10.0,
        skipTime: 5.0,
        skipTextBefore: 'You can skip in ',
        skipTextAfter: 'Skip',
        skippable: true,
        controls: {
            play: true,
            progress: true,
            mute: true,
            volume: true,
            fullscreen: true,
            cancel: true
        },
        theme: 'dark',
        isfullscreen: false //storing state of fullscreen here, reference whenever making interface
    };

    var makeInterface = function (target, instance) {
        instance = instance ? instance : { controls: { play: false, progress: false, mute: false, volume: false, fullscreen: false, cancel: false } };
        var owner,
            svgNS,
            hudElement,
            titleDiv_,
            skipDiv_,
            close_,
            controlTable_, controlBody_, controlRow_, controlFlag_,
            play_,
            pause_,
            progress_,loaded_, playpos_,
            clock_,
            mute_,
            muted_,
            volume_, volumeDefs_, volumeChild_,
            fsInactive_, fsActive_, fullScreen;

        // verify document identity
        owner = target.ownerDocument;
        // verify context svg namespace
        svgNS = document.createElementNS("http://www.w3.org/2000/svg", "svg").namespaceURI;

        // two big assumptions here:
        // * that a video element will be present when building the interface,
        // * that a single video element will be present
        var video = target.getElementsByTagName('video')[ 0 ];
        hudElement = owner.createElement('div');
        hudElement.setAttribute('id', 'myIcon_hud');

        this.element = hudElement; // handy little property for use in external code.

        titleDiv_ = owner.createElement('div');
        titleDiv_.setAttribute('id', 'myIcon_title');
        titleDiv_.setAttribute('class', 'myIcon_active_control');

        skipDiv_ = owner.createElement('div');
        skipDiv_.setAttribute('id', 'myIcon_skip');
        skipDiv_.setAttribute('class', 'myIcon_skip_before myIcon_active_control');

        close_ = owner.createElement('div');
        close_.setAttribute('class', 'myIcon_active_control');
        close_.setAttribute('id', 'myIcon_close');
        close_.innerHTML = '<svg viewBox="0 0 31 31"><path d="M3 0 L0 3 L28 31 L31 28 Z M0 28 L3 31 L31 3 L28 0 Z"></path></svg>';

        // the table has an advantage here in that it can mix fixed width elements with variable width progress bar
        // further, upon removal of a control element, the table collapses the remaining divs politely, all the while
        // automatically placing the controls.
        controlTable_ = owner.createElement( 'table' );
        controlTable_.setAttribute('id', 'myIcon_controls');
        controlBody_ = owner.createElement( 'tbody' );
        controlTable_.appendChild( controlBody_ );

        controlRow_ = owner.createElement( 'tr' );
        controlBody_.appendChild( controlRow_ );

        // play button!
        play_ = owner.createElement( 'td' );
        play_.setAttribute('id', 'myIcon_play');
        play_.innerHTML = '<svg viewBox="0 0 31 31" class="myIcon myIcon_active_control"><path d="M0 0 L0 31 L31 15.5 Z"></path></svg>';

        // pause button
        pause_ = owner.createElement( 'td' );
        pause_.style.display = 'none';
        pause_.setAttribute('id', 'myIcon_pause');
        pause_.innerHTML = '<svg viewBox="0 0 31 31" class="myIcon myIcon_active_control"><path d="M2 2 L2 29 L11 29 L11 2 Z M20 2 L20 29 L29 29 L29 2 Z"></path></svg>';

        // show some divs that auto size and cover a percentage of their widths for
        // play position as well as loaded position.
        progress_ = owner.createElement( 'td' );
        progress_.setAttribute('class', 'myIcon_progress');
        progress_.innerHTML = '<div class="myIcon_progressBacking"><div id="myIcon_loaded"></div><div id="myIcon_playpos"></div></div>';
        playpos_ = progress_.children[ 0 ].children[ 1 ];
        loaded_ = progress_.children[ 0 ].children[ 0 ];

        // show the duration and the current time:
        clock_ = owner.createElement( 'td' );
        clock_.setAttribute('id', 'myIcon_clock');
        // default value for debugging:
        clock_.innerHTML = '00:00 / 00:00';


        // draw a little speaker symbol with a little arc out one side
        mute_ = owner.createElement( 'td' );
        mute_.setAttribute('id', 'myIcon_mute');
        mute_.innerHTML = '<svg viewBox="0 0 31 31" class="myIcon myIcon_active_control"><path d="M0 9 L0 22 L9 22 L18 31 L18 0 L9 9 Z M23 8 A11 11 0 0 1 23 23 L26 26 A15.24 15.24 0 0 0 26 5 Z"></path></svg>';

        // draw an inactive speaker with an active "X" over the top of it.
        muted_ = owner.createElement( 'td' );
        muted_.style.display = 'none';
        muted_.setAttribute('id', 'myIcon_muted');
        muted_.innerHTML = '<svg viewBox="0 0 31 31" class="myIcon myIcon_active_control"><path d="M5 9 L5 22 L14 22 L23 31 L23 0 L14 9 Z" class="myIcon_inactive_control"></path><path class="myIcon_active_control" d="M3 0 L0 3 L28 31 L31 28 Z M0 28 L3 31 L31 3 L28 0 Z"></path></svg>';

        // make a triangular volume control
        volume_ = owner.createElement( 'td' );
        volume_.setAttribute('id', 'myIcon_volume');
        volume_.innerHTML = '<svg viewBox="0 0 31 31" preserveAspectRatio="none" class="myIcon"><defs><linearGradient id="volumeState"><stop class="myIcon_active_control myIcon_vcpos" offset="84%"></stop><stop class="myIcon_inactive_control myIcon_vcpos" offset="84%"></stop></linearGradient></defs><path d="M0 31 L31 31 L31 0 Z" fill="url(#volumeState)"></path></svg>';

        volumeChild_ = volume_.children[ 0 ];
        volumeDefs_ = volumeChild_.getElementsByTagNameNS( svgNS, 'defs')[ 0 ].children[ 0 ].children;

        // fullscreen control:
        fsInactive_ = owner.createElement( 'td' );
        fsInactive_.setAttribute('id', 'myIcon_fs_inactive');
        fsInactive_.innerHTML = '<svg viewBox="0 0 31 31" class="myIcon myIcon_active_control"><path d="M0 0 l0 12 l3 0 l0 -6 l8 8 l3 -3 l-8 -8 l6 0 l0 -3 Z M0 19 l0 12 l12 0 l0 -3 l-6 0 l8 -8 l-3 -3 l-8 8 l0 -6 Z M31 0 l-12 0 l0 3 l6 0 l-8 8 l3 3 l8 -8 l0 6 l3 0 Z M31 31 l0 -12 l-3 0 l0 6 l-8 -8 l-3 3 l8 8 l-6 0 l0 3 Z"></path></svg>';

        fsActive_ = owner.createElement( 'td' );
        fsActive_.setAttribute('id', 'myIcon_fs_active');
        fsActive_.innerHTML = '<svg viewBox="0 0 31 31" class="myIcon myIcon_active_control"><path d="M13 13 l0 -12 l-3 0 l0 6 l-7 -7 l-3 3 l7 7 l-6 0 l0 3 Z M18 13 l12 0 l0 -3 l-6 0 l7 -7 l-3 -3 l-7 7 l0 -6 l-3 0 Z M13 18 l-12 0 l0 3 l6 0 l-7 7 l3 3 l7 -7 l0 6 l3 0 Z M18 18 l0 12 l3 0 l0 -6 l7 7 l3 -3 l-7 -7 l6 0 l0 -3 Z"></path></svg>';

        hudElement.appendChild(titleDiv_);
        if( instance.skippable ){
            hudElement.appendChild(skipDiv_);
        }
        if( instance.controls.cancel ){
            hudElement.appendChild(close_);
        }

        // decide what to display based on the 'instance' object.
        controlFlag_ = false;
        if( instance.controls.play ){
            controlFlag_ = true;
            controlRow_.appendChild( play_ );
            controlRow_.appendChild( pause_ );
        }
        if( instance.controls.progress ){
            controlFlag_ = true;
            controlRow_.appendChild( progress_ );
            controlRow_.appendChild( clock_ );
        }
        if( instance.controls.mute ){
            controlFlag_ = true;
            controlRow_.appendChild( mute_ );
            controlRow_.appendChild( muted_ );
        }
        if( instance.controls.volume ){
            controlFlag_ = true;
            controlRow_.appendChild( volume_ );
        }
        if( instance.controls.fullscreen ){
            controlFlag_ = true;
            controlRow_.appendChild( fsInactive_ );
            controlRow_.appendChild( fsActive_ );
            if( instance.isfullscreen ){
                fsInactive_.style.display = 'none';
            }
            else{
                fsActive_.style.display = 'none';
            }
            controlRow_.appendChild( fsInactive_ );
            controlRow_.appendChild( fsActive_ );
        }
        if( controlFlag_ ) hudElement.appendChild( controlTable_ );


        this.play = ( function(){
            var playing = false;
            return function( evt ){
                evt.preventDefault();
                if( !playing ){
                    playing = true;
                    play_.style.display = 'none';
                    pause_.style.display = '';
                    video.play();
                }
                else{
                    playing = false;
                    pause_.style.display = 'none';
                    play_.style.display = '';
                    video.pause();
                }
            }
        } )( video );
        this.mute = ( function(){
            return function( evt ){
                evt.preventDefault();
                if( !video.muted ){
                    video.muted = true;
                    mute_.style.display = 'none';
                    muted_.style.display = '';
                }
                else{
                    video.muted = false;
                    muted_.style.display = 'none';
                    mute_.style.display = '';
                }
            }
        } )( video );
        this.volume = ( function(){
            var rect = { left: 0, width: 1 };
            var percentTxt = '';
            return function( evt ){
                var event = evt? evt : { type: 'init' };
                var touch = {};
                var touchX = 0;
                if( event.type == 'init' ){
                    percentTxt = ( video.volume ) * 100 + '%';
                }
                else{
                    if( event.type == 'touchmove' ){
                        touch = evt.changedTouches[ 0 ];
                        touchX = parseInt( touch.clientX );
                    }
                    else{
                        touchX = parseInt( event.clientX )
                    }
                    evt.preventDefault();
                    if( evt.buttons === 1 || evt.type === 'click' || evt.type == 'touchmove' ){
                        rect = volume_.getBoundingClientRect();
                        var volumeNormalized = ( ( touchX - rect.left )/ rect.width );
                        percentTxt = volumeNormalized * 100 + '%' ;
                        video.volume = volumeNormalized;
                    }
                }
                volumeDefs_[0].setAttributeNS(null, 'offset', percentTxt);
                volumeDefs_[1].setAttributeNS(null, 'offset', percentTxt);
            };
        } )( video );
        this.progress = ( function(){
            var rect = { left: 0, width: 1 };
            var percent = 0;
            var percentTxt = '';
            var currentTime = { val: 0, min: 0, sec: 0 };
            var duration = { val: 0, min: 0, sec: 0 };
            var clockTxt = '';
            return function( evt ){
                if( evt.type === 'timeupdate' ){
                    currentTime.val = evt.target.currentTime;
                    currentTime.sec = Math.floor( currentTime.val % 60);
                    currentTime.min = Math.floor( currentTime.val / 60);
                    if( currentTime.min < 10 ){ currentTime.min = '0' + currentTime.min.toString(); }
                    if( currentTime.sec < 10 ){ currentTime.sec = '0' + currentTime.sec.toString(); }
                    duration.val = evt.target.duration;
                    duration.sec = Math.floor( duration.val % 60);
                    duration.min = Math.floor( duration.val / 60);
                    if( duration.min < 10 ){ duration.min = '0' + duration.min.toString(); }
                    if( duration.sec < 10 ){ duration.sec = '0' + duration.sec.toString(); }
                    rect = progress_.getBoundingClientRect();
                    percentTxt = ( currentTime.val / duration.val ) * 100 + '%' ;
                    playpos_.style.width = percentTxt;
                    clock_.innerHTML = currentTime.min + ':' + currentTime.sec + ' / ' + duration.min + ':' + duration.sec;
                }
            };
        } )();
        this.loaded = ( function(){
            var currentTime = 0;
            var section = 0;
            var buffObj = {};
            return function( evt ){
                if( evt.type === 'progress' ){
                    currentTime = evt.target.currentTime;
                    section = 0;
                    buffObj = evt.target.buffered;
                    while( !( buffObj.start( section ) <= currentTime && currentTime <= buffObj.end( section ) ) ) {
                        section++;
                    }
                    var loadEndPercentage = buffObj.end( section ) / evt.target.duration * 100;
                    loaded_.style.width = loadEndPercentage + '%';
                }
            };
        } )();

        fullScreen = new CustomEvent('myIcon_fullScreen');
        this.fullscreen = function(){
            target.dispatchEvent( fullScreen );
        };
        this.fullscreenExternalUpdate = function( evt ){
            if( evt.type === 'myIcon_enterFs' ){
                fsInactive_.style.display = 'none';
                fsActive_.style.display = '';
            }
            else{
                fsActive_.style.display = 'none';
                fsInactive_.style.display = '';
            }
        };
        this.title = function (str) {
            if (str) titleDiv_.innerHTML = str;
            else if (instance.adTitle) {
                if (instance.adTitle.length > 0) titleDiv_.innerHTML = '"' + instance.adTitle + '"';
            }
            else {
                titleDiv_.style.display = 'none';
            }
        };
        this.skipRemaining = function (num) {
            if (instance.skipTextBefore) {
                skipDiv_.innerText = instance.skipTextBefore + ' ' + num + ' s';
            }
            else {
                skipDiv_.innerText = num + ' s';
            }
        };
        this.skipTextAfter = function () {
            if (instance.skipTextAfter) {
                if (instance.skipTextAfter.length > 0) {
                    skipDiv_.innerText = instance.skipTextAfter;
                }
            }
            else {
                skipDiv_.style.display = 'none';
            }
        };

        // this is the method to hide the controls when the ad is playing, but show when moving mouse over it
        this.showHud = (function () {
            var hudVisible = false;
            var hideTimer;
            function hide() {
                hudVisible = false;
                hudElement.setAttribute('class', 'myIcon_invisible');
            }
            function show() {
                hudVisible = true;
                hudElement.setAttribute('class', '');
            }
            function timer() {
                return setTimeout(hide, 1000);
            }
            return function () {
                if (!hudVisible) {
                    show();
                    hideTimer = timer();
                }
                else {
                    clearTimeout(hideTimer);
                    hideTimer = timer();
                }
            };
        })();

        hudElement.addEventListener('click', this.showHud );
        hudElement.addEventListener('mousemove', this.showHud );
        hudElement.addEventListener('touchstart', this.showHud );

        video.addEventListener('timeupdate', this.progress );
        video.addEventListener('progress', this.loaded );

        play_.addEventListener('click', this.play );
        play_.addEventListener('touchstart', this.play );
        pause_.addEventListener('click', this.play );
        pause_.addEventListener('touchstart', this.play );

        mute_.addEventListener('click', this.mute );
        mute_.addEventListener('touchstart', this.mute );
        muted_.addEventListener('click', this.mute );
        muted_.addEventListener('touchstart', this.mute );

        volume_.addEventListener('click', this.volume );
        volume_.addEventListener('mousemove', this.volume );
        volume_.addEventListener('touchmove', this.volume );

        fsActive_.addEventListener('click', this.fullscreen );
        fsActive_.addEventListener('touchstart', this.fullscreen );
        fsInactive_.addEventListener('click', this.fullscreen );
        fsInactive_.addEventListener('touchstart', this.fullscreen );

        target.addEventListener('myIcon_enterFs', this.fullscreenExternalUpdate );
        target.addEventListener('myIcon_exitFs', this.fullscreenExternalUpdate);

        // initial conditions:
        this.volume();
        this.title();
        this.skipRemaining( instance.skipTime );

        // here is where we attach the display to the target
        target.appendChild( hudElement );
        return this;
    };

    function fullScreen( evt ){
        var target = evt.target;
        if( !instance.isfullscreen ){
            if (target.requestFullscreen) {
                target.requestFullscreen();
            }
            else if (vid.msRequestFullscreen) {
                target.msRequestFullscreen();
            }
            else if (vid.mozRequestFullScreen) {
                target.mozRequestFullScreen();
            }
            else if (vid.webkitRequestFullscreen) {
                target.webkitRequestFullscreen();
            }
        }
        else{
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
            else if (document.msExitFullscreen) {
                document.msExitFullscreen();
            }
            else if (document.mozCancelFullScreen) {
                document.mozCancelFullScreen();
            }
            else if (document.webkitCancelFullScreen) {
                document.webkitCancelFullScreen();
            }
        }
    }

    // handle the event of changing the fullscreen status externally, like hitting 'escape' or 'done'
    // the assumption is that we are flipping the state.
    function fullscreenExternalUpdate( evt ){
        var target = evt.target;
        var enter = new CustomEvent('myIcon_enterFs');
        var exit = new CustomEvent('myIcon_exitFs');
        if( instance.isfullscreen ){
            instance.isfullscreen = false;
            target.dispatchEvent( exit );
        }
        else{
            instance.isfullscreen = true;
            target.dispatchEvent( enter );
        }
    }

    document.addEventListener("fullscreenchange", fullscreenExternalUpdate);
    document.addEventListener("webkitfullscreenchange", fullscreenExternalUpdate);
    document.addEventListener("mozfullscreenchange", fullscreenExternalUpdate );
    document.addEventListener("MSFullscreenChange", fullscreenExternalUpdate );

    // actual use of the display in the application:
    var hud = new makeInterface( vid, instance );

    // listen for the event fired from the interface
    vid.addEventListener( 'myIcon_fullScreen', fullScreen );
}

var startMeUp = setInterval(function () {
    if (document.readyState === 'complete') {
        clearInterval(startMeUp);
        myApplication();
    }
}, 100);