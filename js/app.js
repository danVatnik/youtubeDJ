function tplawesome(e,t){res=e;for(var n=0;n<t.length;n++){res=res.replace(/\{\{(.*?)\}\}/g,function(e,r){return t[n][r]})}return res}

$(function() {
    $("form").on("submit", function(e) {
       e.preventDefault();
       // prepare the request
       var request = gapi.client.youtube.search.list({
            part: 'snippet',
            type: "video",
            q: encodeURIComponent($("#search").val()).replace(/%20/g, "+"),
            videoEmbeddable: true
       }); 
       // execute the request
       request.execute(function(response) {
          var results = response.result;
          $(".search-items").html("");
          $(".search-items").show();
          $.each(results.items, function(index, item) {
            console.log(item);
              
            var url = "https://www.googleapis.com/youtube/v3/videos?part=statistics&id=" + item.id.videoId + "&key=" + googleAPIKey;
            $.ajax({url: url, success: function(result){
                $.get("item.html", function(data) {
                    $(".search-items").append(tplawesome(data, [{
                        "title":item.snippet.title, 
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
    });

    $(window).on("resize", resetVideoHeight);

    $( ".sortable" ).sortable({
        placeholder: "ui-state-default"
        });
        $( ".sortable" ).disableSelection();
});


function resetVideoHeight() {
    $(".video").css("height", $("#results").width() * 9/16);
}

function init() {
    gapi.client.setApiKey(googleAPIKey);
    gapi.client.load("youtube", "v3", function() {
        // yt api is ready
    });
}

function getSuggestions(){
    if($("#search").val() == "")
        return;
    var url = "https://cors-anywhere.herokuapp.com/" + "http://suggestqueries.google.com/complete/search?client=firefox&ds=yt&q=" + encodeURIComponent($("#search").val()).replace(/%20/g, "+")
    $.ajax({url: url, success: function(result){
        var suggestions = JSON.parse(result)[1];
        $(".search-items").show();
        $(".suggestion-item").show();
        if($(".search-items").children(".suggestion-item").length == 0){
            $(".search-items").html("");
            $.each(suggestions,function(index, item){
                $.get("suggestions.html", function(data) {
                    $(".search-items").append(tplawesome(data, [{"suggestion":item}]));
                });                
            });
        }
        else{
            currentSuggestions = $(".search-items").children();
            for (let index = 0; index < currentSuggestions.length; index++) {
                $(currentSuggestions[index]).children("div").children("p").html(suggestions[index]);
                $(currentSuggestions[index]).attr("onclick","selectSuggestion('" + suggestions[index] + "')");
            }
        }
        console.log(JSON.parse(result));
    }});
}

function selectSuggestion(suggestion){
    $("#search").val(suggestion);
    $("#search").submit();
}

function addToPlaylist(i){
    console.log(i);
    console.log($("#" + i).data("title"));
    item = $("#" + i);
    $.get("item.html", function(data) {
        $("#playlist-items").append(tplawesome(data, [{"title":item.data('title'), 
        "videoid":item.data('videoid'),
        "onclickFunction":"setToPlayerOnItemClick",
        "image":item.data('image'),
        "id":item.data('videoid') + "-playlist",
        "channel":item.data('channel'),
        "views":item.data('views')
    }]));
    });

    $(".search-items").hide();
}

function formatViews(val){
    var precisionVal = Number.parseFloat(val).toPrecision(3);

    if(precisionVal.length == 3)
        return val;
    
    var magnitude = precisionVal[precisionVal.length -1];

    if(magnitude == "3"){
        return precisionVal[0] + precisionVal[1] + precisionVal[2] + precisionVal[3] + "k";
    }
    
    if(magnitude == "4"){
        return precisionVal[0] + precisionVal[2] + precisionVal[1] + precisionVal[3] + "k";
    }

    if(magnitude == "5"){
        return precisionVal[0] + precisionVal[2] + precisionVal[3] + "k";
    }

    if(magnitude == "6"){
        return precisionVal[0] + precisionVal[1] + precisionVal[2] + precisionVal[3] + "M";
    }

    if(magnitude == "7"){
        return precisionVal[0] + precisionVal[2] + precisionVal[1] + precisionVal[3] + "M";
    }

    if(magnitude == "8"){
        return precisionVal[0] + precisionVal[2] + precisionVal[3] + "M";
    }

    if(magnitude == "9"){
        return precisionVal[0] + precisionVal[1] + precisionVal[2] + precisionVal[3] + "B";
    }

    if(magnitude == "10"){
        return precisionVal[0] + precisionVal[2] + precisionVal[1] + precisionVal[3] + "B";
    }

    if(magnitude == "11"){
        return precisionVal[0] + precisionVal[2] + precisionVal[3] + "B";
    }
}