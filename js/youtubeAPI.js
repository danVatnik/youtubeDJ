    var player1Name = 'player1';
    var player2Name = 'player2';
    //var player2Name = 'player3';
    var player1;
    var player2;
    var firstLoadOfVideoPlayer1 = true;
    var firstLoadOfVideoPlayer2 = true;

    var player1CheckInProgress = false;
    var player2CheckInProgress = false;

    var playerOnTheLeft = player1Name;

    var switchingPlayers = false; 

    // 2. This code loads the IFrame Player API code asynchronously.
    var tag = document.createElement('script');
    
    tag.src = "https://www.youtube.com/iframe_api";
    var firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

    // 3. This function creates an <iframe> (and YouTube player)
    //    after the API code downloads.

    
    function onYouTubeIframeAPIReady() {
        player1 = new YT.Player(player1Name, {
            height: $(".player1-column").width() * 9/16,
            width: $(".player1-column").width(),
            videoId: 'kJQP7kiw5Fk',
            events: {
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange
            }
        });

        player2 = new YT.Player(player2Name, {
            height: $(".player2-column").width() * 9/16,
            width: $(".player2-column").width(),
            videoId: 'HCjNJDNzw8Y',
            events: {
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange
            }
        });
    }

    // 4. The API will call this function when the video player is ready.
    function onPlayerReady(event) {
        //event.target.playVideo();
        if(event.target == player1 && firstLoadOfVideoPlayer1){
            firstLoadOfVideoPlayer1 = false;
            event.target.pauseVideo();
        }
        else if(event.target == player2 && firstLoadOfVideoPlayer2){
            firstLoadOfVideoPlayer2 = false;
            event.target.pauseVideo();
        }

        getRelatedVideos(event.target.videoId, event.target);
    }

    // 5. The API calls this function when the player's state changes.
    //    The function indicates that when playing a video (state=1),
    //    the player should play for six seconds and then stop.

    function onPlayerStateChange(event) {
        if (event.data == YT.PlayerState.PLAYING) {
            if(event.target == player1 && firstLoadOfVideoPlayer1){
                firstLoadOfVideoPlayer1 = false;
                event.target.pauseVideo();
            }
            else if(event.target == player2 && firstLoadOfVideoPlayer2){
                firstLoadOfVideoPlayer2 = false;
                event.target.pauseVideo();
            }
            else{
                if(event.target == player1 && !player1CheckInProgress){
                    checkForEndOfSong(event.target, event.target.getDuration(), player1CheckInProgress);
                    player1CheckInProgress = true;
                }
                else if(event.target == player2 && !player2CheckInProgress){
                    checkForEndOfSong(event.target, event.target.getDuration(), player2CheckInProgress);
                    player2CheckInProgress = true;
                }
                console.log(event.target.getDuration());
            }
            //startWorker();
        }
        if ((event.data == YT.PlayerState.ENDED || event.data == YT.PlayerState.ERROR) && !switchingPlayers){
            //setNextVideoFromPlaylistToPlayer(event.target)
            switchPlayers(event.target);
        }
    }
    
    function checkForEndOfSong(player, duration, checkInProgress){
        if(checkInProgress)
            return;
        if ((duration - player.getCurrentTime()) <= 15) {
            switchPlayers(player);
            return;
        } else {
            return setTimeout((function() {
                return checkForEndOfSong(player, duration, checkInProgress);
            }), 1000);
        }
    }

    function setNextVideoFromPlaylistToPlayer(player){
        var currentPlayerInfo = "";
        var currentPlayerRelatedVideos = "";
        if(player == player1){
            currentPlayerInfo = "#player1-info";
            currentPlayerRelatedVideos = "#related-items-player-1";
            player1CheckInProgress = false;
        }
        else{
            currentPlayerInfo = "#player2-info";
            currentPlayerRelatedVideos = "#related-items-player-2";
            player2CheckInProgress = false;
        }
        var playlistItems = $("#playlist-items").children();
        if(playlistItems.length > 0){
            var item = playlistItems[0];
            setVideoInPlayerPanel(player, $(item).data("videoid"));
            setVideoInfo(item, currentPlayerInfo);
            item.remove()
        }
        else{
            playlistItems = $(currentPlayerRelatedVideos).children();
            if(playlistItems.length > 0 ){
                var item = playlistItems[3];
                setVideoInPlayerPanel(player, $(item).data("videoid"));
                setVideoInfo(item, currentPlayerInfo);
                item.remove()
            }
        }
    }

    function pauseVideo(player) {
        player.pauseVideo();
    }

    function setVideoInPlayerPanel(player, videoId){
        player.loadVideoById(videoId, 0);
        getRelatedVideos(videoId, player);
        if(player == player1)
            firstLoadOfVideoPlayer1 = true;
        if(player == player2)
            firstLoadOfVideoPlayer2 = true;
    }


    function getRelatedVideos(videoId, player){
        var currentPlayerRelatedVideos = "";
        var currentPlayerInfo = "";
        if(player == player1){
            currentPlayerRelatedVideos = "#related-items-player-1";
            currentPlayerInfo = "#player1-info";
        }
        else{
            currentPlayerRelatedVideos = "#related-items-player-2";
            currentPlayerInfo = "#player2-info";
        }

        var request = gapi.client.youtube.search.list({
            part: "snippet",
            type: "video",
            relatedToVideoId: videoId,
            videoEmbeddable: true
       }); 
       // execute the request
       request.execute(function(response) {
            var results = response.result;
            $(currentPlayerRelatedVideos).html("");
            $.each(results.items, function(index, item) {
                console.log(item);
                var url = "https://www.googleapis.com/youtube/v3/videos?part=statistics&id=" + item.id.videoId + "&key=" + googleAPIKey;
                $.ajax({url: url, success: function(result){
                    $.get("relatedItem.html", function(data) {
                        $(currentPlayerRelatedVideos).append(tplawesome(data, [{"title":item.snippet.title, 
                        "videoid":item.id.videoId, 
                        "image":item.snippet.thumbnails.medium.url,
                        "onclickFunction":"addToPlaylist",
                        "id":item.id.videoId + "-search",
                        "channel":item.snippet.channelTitle,
                        "views": formatViews(result.items[0].statistics.viewCount)
                    }]));  
                });
            }});
          });
          resetVideoHeight();
        });
    }

    function switchPlayers(origin){

        switchingPlayers = true;
        $("#switch-players-button").prop('disabled', true);
        $("#load-video-button").prop('disabled', true);

        var pl1State = player1.getPlayerState();
        var pl2State = player2.getPlayerState();

        // if(pl1State == YT.PlayerState.PLAYING || origin == player1){
        //     player2.playVideo();
        //     //player2.unmute();
        //     basculateVolume(player1, player2);
        //     //slidePlayers();
        // }
        // else if(pl2State == YT.PlayerState.PLAYING || origin == player2){
        //     player1.playVideo();
        //     //player1.unmute();
        //     basculateVolume(player2, player1);
        //     //slidePlayers();
        // }
        // else 
        if(playerOnTheLeft == player1Name){
            player2.playVideo();
            basculateVolume(player1, player2);
            //slidePlayers();
        }
        else if(playerOnTheLeft == player2Name){
            player1.playVideo();
            basculateVolume(player2, player1);
            //slidePlayers();
        }

    }

    function slidePlayers(){
        var transitionSpeed = 5000;
        // player 1 on the left
        if(playerOnTheLeft == player1Name){

            $("." + "player2-column").animate({left: -$(".player2-column").outerWidth() + "px"}, transitionSpeed);
            
            $("." + "player1-column").animate({left: -$(".player1-column").outerWidth() + "px", opacity: '0'}, {
                duration: transitionSpeed,
                complete: function(){
                    $("." + "player1-column").css("left", ($("." + "player1-column").position().left + 3 * $(".player1-column").outerWidth()) + "px");
                    $("." + "player1-column").animate({left: $(".player1-column").outerWidth() + "px", opacity: '1'},{
                        duration:"slow",
                        complete: function(){
                            switchingPlayers = false;
                            $("#switch-players-button").prop('disabled', false);
                            $("#load-video-button").prop('disabled', false);
                        }
                    });
                }    
            });
            playerOnTheLeft = player2Name;
        }
        else{
            // player 2 on the left
            $("." + "player1-column").animate({left: 0 + "px"}, transitionSpeed);
            $("." + "player2-column").animate({left: 2 * -$(".player2-column").outerWidth() + "px", opacity: '0'}, {
                duration: transitionSpeed,
                complete: function(){
                    $("." + "player2-column").css("left", ($("." + "player2-column").position().left + 2 * $(".player1-column").outerWidth()) + "px");
                    $("." + "player2-column").animate({left: 0 + "px", opacity: '1'}, 
                    {
                        duration:"slow",
                        complete: function(){
                            switchingPlayers = false;
                            $("#switch-players-button").prop('disabled', false);
                            $("#load-video-button").prop('disabled', false);
                        }
                    });
                }    
            });
            playerOnTheLeft = player1Name;
        }
    }

    function basculateVolume(playerEnding, playerStarting){
        var maxVolume = playerEnding.getVolume();
        //playerStarting.setVolume(maxVolume);
        setVolumes(playerEnding, playerStarting, 1, maxVolume);

    }
    
    function setVolumes(playerEnding, playerStarting, index, maxVolume){
        if(index >= maxVolume){
            setVolumePlayerEnding(playerEnding, 1, maxVolume);
            slidePlayers();
            return;
        }
        else{
            playerStarting.setVolume(index);
            return setTimeout((function() {
                return setVolumes(playerEnding, playerStarting, index + 1, maxVolume);
            }), 40);
        }  
    }

    function setVolumePlayerEnding(playerEnding, index, maxVolume){
        if (index >= maxVolume) {
            playerEnding.stopVideo();
            playerEnding.unMute();
            setNextVideoFromPlaylistToPlayer(playerEnding);
            return;
        }
        else {
            playerEnding.setVolume(maxVolume - index);
            return setTimeout((function() {
                return setVolumePlayerEnding(playerEnding, index + 1, maxVolume);
            }), 40);
        }
    }

    function setToPlayerOnItemClick(id){
        item = $("#" + id);
        var chosenPlayer = "";

        var pl1State = player1.getPlayerState();
        var pl2State = player2.getPlayerState();

        if(pl1State != YT.PlayerState.PLAYING){
            setVideoInPlayerPanel(player1, $(item).data("videoid"));
            setVideoInfo(item, "#player1-info");
            item.remove();
        }
        else if(pl2State != YT.PlayerState.PLAYING){
            setVideoInPlayerPanel(player2, $(item).data("videoid"));
            setVideoInfo(item, "#player2-info");
            item.remove();
        }
    }

    function setToPlayer(){
        playlistItems = $("#playlist-items").children();
        if(playlistItems.length > 0){
            item = playlistItems[0];
            if(playerOnTheLeft == player1Name){
                setVideoInPlayerPanel(player2, $(item).data("videoid"));
                setVideoInfo(item, "#player2-info");
            }
            else if(playerOnTheLeft == player2Name){
                setVideoInPlayerPanel(player1, $(item).data("videoid"));
                setVideoInfo(item, "#player1-info");
            }
            item.remove();
        }
    }

    function setVideoInfo(item, playerTag){
        $(playerTag).html("")
        $.get("playerInfo.html", function(data) {
            $(playerTag).append(tplawesome(data, [{
                "title":$(item).data("title"), 
                "views": $(item).data("views")
            }]));
        });
    }

    // function startWorker() {
    //     if(typeof(Worker) !== "undefined") {
    //         if(typeof(w) == "undefined") {
    //             w = new Worker("/js/triggerSongEnd.js");

    //             if(playerOnTheLeft == player1Name)
    //                 w.postMessage(player1);
    //             else
    //             w.postMessage(player2);
    //         }
    //         // w.onmessage = function(event) {
    //         //     //document.getElementById("result").innerHTML = event.data;
    //         // };
    //     } else {
    //         //document.getElementById("result").innerHTML = "Sorry, your browser does not support Web Workers...";
    //     }
    // }
    
    // function stopWorker() { 
    //     w.terminate();
    //     w = undefined;
    // }