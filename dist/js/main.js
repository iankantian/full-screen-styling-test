/**
 * Created by joshuabrown on 8/31/16.
 */
/**
 * Created by joshuabrown on 8/25/16.
 */
(function(){
    function application(){
        var hud = document.getElementById('HUD');
        var showHud = (function(){
            var hudVisible = false;
            var hideTimer;
            function hide(){
                hudVisible = false;
                console.log('hiding', hud.setAttribute('class', 'invisible') );
                console.log('hiding', hud );
            }
            function show(){
                hudVisible = true;
                console.log('showing', hud.setAttribute('class', '') );
                console.log('hiding', hud );
            }
            function timer(){
                return setTimeout( hide, 1500 );
            }
            return function (){
                if( !hudVisible ){
                    show();
                    hideTimer = timer();
                }
                else{
                    clearTimeout( hideTimer );
                    hideTimer = timer();
                }
            };
        })();
        HUD.addEventListener('mousemove', showHud );
        HUD.addEventListener('touchstart', showHud );
    }

    var document_ready = setInterval(function () {
        if ( document.readyState === 'complete' ) {
            clearInterval( document_ready );
            application();
        }
    }, 10);
})();
