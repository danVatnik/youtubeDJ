    var player1Name = 'player1';
    var player2Name = 'player2';
    var player1;
    var player2;
    var firstLoadOfVideoPlayer1 = true;
    var firstLoadOfVideoPlayer2 = true;

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
    var done = false;
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
        }
        if (event.data == YT.PlayerState.ENDED || event.data == YT.PlayerState.ERROR){
            setNextVideoFromPlaylistToPlayer(event.target)
        }
    }

    function setNextVideoFromPlaylistToPlayer(player){
        var currentPlayerInfo = "";
        if(player == player1){
            currentPlayerInfo = "#player1-info";
        }
        else{
            currentPlayerInfo = "#player2-info";
        }
        playlistItems = $("#playlist-items").children();
        if(playlistItems.length > 0){
            item = playlistItems[0];
            setVideoInPlayerPanel(player, $(item).data("videoid"));
            setVideoInfo(item, currentPlayerInfo);
            item.remove()
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
                    $.get("item.html", function(data) {
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

    function switchPlayers(){
        pl1State = player1.getPlayerState();
        pl2State = player2.getPlayerState();

        if(pl1State == YT.PlayerState.PLAYING){
            player2.playVideo();
            //player2.unmute();
            basculateVolume(player1, player2);

        }
        else if(pl2State == YT.PlayerState.PLAYING){
            player1.playVideo();
            //player1.unmute();
            basculateVolume(player2, player1);
        }
    }

    function basculateVolume(playerEnding, playerStarting){
        var maxVolume = playerEnding.getVolume();
        playerStarting.setVolume(maxVolume);
        setVolumes(playerEnding, playerStarting, 1, maxVolume);

    }
    
    function setVolumes(playerEnding, playerStarting, index, maxVolume){
        if (index == maxVolume) {
            playerEnding.stopVideo();
            playerEnding.unMute();
            setNextVideoFromPlaylistToPlayer(playerEnding);
            return;
        } else {
            playerEnding.setVolume(maxVolume - index);
            return setTimeout((function() {
                return setVolumes(playerEnding, playerStarting, index + 1, maxVolume);
            }), 75);
  }
    }

    function setToPlayerOnItemClick(id){
        item = $("#" + id);
        var chosenPlayer = "";

        pl1State = player1.getPlayerState();
        pl2State = player2.getPlayerState();

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

    function setToPlayer(playerNumber){
        playlistItems = $("#playlist-items").children();
        if(playlistItems.length > 0){
            item = playlistItems[0];
            if(playerNumber == 1){
                setVideoInPlayerPanel(player1, $(item).data("videoid"));
                setVideoInfo(item, "#player1-info");
            }
            else if(playerNumber == 2){
                setVideoInPlayerPanel(player2, $(item).data("videoid"));
                setVideoInfo(item, "#player2-info");
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
