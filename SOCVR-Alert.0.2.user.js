// ==UserScript==
// @name         SOCVR Alert
// @namespace    https://github.com/Jacob-Gray/SE-Userscripts
// @version      0.2
// @description  Watch's a chat room for new smoke-detector posts and cv-pls, and triggers a desktop notification
// @author       Jacob Gray
// @match        *://chat.meta.stackexchange.com/rooms/*
// @match        *://chat.stackoverflow.com/rooms/*
// @match        *://chat.stackexchange.com/rooms/*
// @require      https://code.jquery.com/jquery-2.1.4.min.js
// @grant        GM_xmlhttpRequest
// @grant        GM_notification
// @grant        Notifications
// ==/UserScript==

(function() {
    'use strict';
    var chat = document.getElementById('chat'),
        MutationObserver = window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver,
        images = {
            "smokey":"https://i.stack.imgur.com/m9xyh.jpg?s=128&g=1",
            "cvpls":"http://i.imgur.com/xyQb3Y4.jpg"
        },
        currentVersion = 0.2,
        updateURL = "https://raw.githubusercontent.com/Jacob-Gray/SE-Userscripts/master/current/SOCVR-Alert.update.user.js",
        checkUpdateURL = "https://raw.githubusercontent.com/Jacob-Gray/SE-Userscripts/master/current/SOCVR-Alert.update.version",
        styles = ".socvr-alert-snackbar{position:fixed;display:none;z-index:100;top:0;left:0;right:0;background:#305d5d;font-size: 110%;color:white;text-align:center;padding:10px;font-family:inherit;}";

    function watch(el, isMsgList){
        isMsgList = isMsgList || false;

        var observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                parseInput(mutation.addedNodes, isMsgList);
            });
        });

        observer.observe(el, {childList: true});
    }

    function checkForUpdates(){
        $.ajax({
            url: checkUpdateURL,
            success: function(data){
                console.log("SOCVR Alert: New version detected "+data);
                if(data > currentVersion) snackbar("SOCVR Alert Version "+data+" is published! Click here to update.", function(){
                    window.open(updateURL, '_blank');
                    $(".socvr-alert-snackbar").html("Click here to reload the page after updating").off("click").on("click",function(){
                        document.location.reload();
                    });
                });
            }
        });
    }

    function init(){
        var setUp = true;

        if (!("Notification" in window)) {
            setUp = false;
            snackbar("Your browser sucks. Deal with it.", 5000);
        }
        else if (Notification.permission !== 'denied' && Notification.permission !== "granted") {
            Notification.requestPermission(function (permission) {
                if (permission === "granted") {
                    notify("Why didn't you allow notifications sooner?", "You're welcome", "http://i.imgur.com/57QnIx1.jpg","https://www.youtube.com/watch?v=dQw4w9WgXcQ");
                }
                else{
                    snackbar("Y U NO ALLOW NOTIFICATIONS?!!!", 5000);
                    setUp = false;
                }
            });
        }

        checkForUpdates();

        $("<style></style>").html(styles).appendTo("body");
        $("body").append("<div class='socvr-alert-snackbar'></div>");

        try{
            if(setUp) watch(chat);
        } catch(e){
            snackbar("[Error] "+e.name + ': ' + e.message);
        }
    }


    $(document).ready(function(){
        
        setTimeout(init, 1000);//There has to be a better way to do this
    });

    function parseInput(Nodes, isMsgList){
        if(isMsgList) checkMessages(Nodes);
        else{
            Nodes.forEach(function(Node){
                try{
                    var msgList = Node.querySelector("div.messages"),
                        msgs = msgList.querySelectorAll(".message");
                    checkMessages(msgs);
                    watch(msgList, true);
                } catch (e){
                    return false;
                }
            });
        }
    }

    function checkMessages(msgs){
        Array.prototype.forEach.call(msgs, function(msg){

            var content = msg.querySelector(".content").innerHTML.replace(/<([^>]+)>/g,""),
                isCVPls = msg.contains(msg.querySelector(".ob-post-tag")) && /cv-pl[sz]/.test(msg.querySelector(".ob-post-tag").innerHTML);

            if(/\[ SmokeDetector \]/.test(content)){//Is smokey post
                var reason = getText(msg).split("]")[1].split(":")[0].replace(/^ */g,""),
                    url = "";

                $("a", msg).each(function(){
                    if( /^(http:\/\/|\/\/)(www\.)?stackoverflow.com\/(questions|q|answers|a)\/\d+/.test($(this).attr("href"))) url = $(this).attr("href");
                });

                notify("New SmokeDetector post",reason, images.smokey, url);
            }
            else if(isCVPls){//Is CV Request
                var reason = getText(msg).split(" - ")[0],
                    url = "";

                $("a", msg).each(function(){
                    if( /stackoverflow.com\/(questions|q|answers|a)\/\d+/.test($(this).attr("href"))) url = $(this).attr("href");
                });
                notify("New close vote request", reason, images.cvpls, url);
            }
        });
    }

    function notify(msg, body, icon, url) {
        var options = {icon:icon,body:body};
        if (Notification.permission === "granted") {
            var notification = new Notification(msg,options);
            notification.onclick = url !== ""?function(event) {
                openTab(event, url);
            }: null;
        }


    }
    function openTab(event, url){
        event.preventDefault();
        window.open(url, '_blank');
    }

    function snackbar(text, duration){
        var bar = $(".socvr-alert-snackbar");
        bar.html(text).slideDown();
        if(typeof duration == "number") setTimeout(function(){
            bar.slideUp();
        }, duration);
        else if(typeof duration == "function") bar.on("click", duration);
    }

    function getText(msg){
        return $(".content", msg).clone().children().remove().end().text().replace(/^ */g,"");
    }

})();
