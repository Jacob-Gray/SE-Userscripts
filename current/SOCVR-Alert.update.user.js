// ==UserScript==
// @name         SOCVR Alert
// @namespace    https://github.com/Jacob-Gray/SE-Userscripts
// @version      0.6
// @description  Watch's a chat room for new smoke-detector posts and cv-pls, and triggers a desktop notification
// @author       Jacob Gray
// @match        *://chat.meta.stackexchange.com/rooms/*
// @match        *://chat.stackoverflow.com/rooms/*
// @match        *://chat.stackexchange.com/rooms/*
// @require      https://code.jquery.com/jquery-2.1.4.min.js
// @grant        GM_xmlhttpRequest
// @grant        GM_notification
// @grant        GM_setValue
// @grant        GM_getValue
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
        currentVersion = 0.6,
        updateURL = "https://raw.githubusercontent.com/Jacob-Gray/SE-Userscripts/master/current/SOCVR-Alert.update.user.js",
        checkUpdateURL = "https://raw.githubusercontent.com/Jacob-Gray/SE-Userscripts/master/current/SOCVR-Alert.update.json",
        styles = ".socvr-alert-dialog,.socvr-alert-snackbar{position:fixed;display:none;top:0;left:0;right:0}.socvr-alert-snackbar{z-index:100;cursor:pointer;background:#305d5d;font-size:110%;color:#fff;text-align:center;font-family:inherit;padding:10px}.socvr-alert-dialog{bottom:0;z-index:99;justify-content:center;align-items:center}.socvr-alert-dialog.active{display:flex!important}.socvr-alert-dialog-back{position:absolute;top:0;left:0;right:0;bottom:0;opacity:.5;background:linear-gradient(to left,#485563,#29323c)}.socvr-alert-dialog-con{max-width:600px;opacity:0;position:relative;background:#fff;transform:translateY(-50px);transition:.3s;margin:auto;border-radius:2px;box-shadow:0 0 2px rgba(0,0,0,.2),0 2px 1px rgba(0,0,0,.2);padding:10px}.socvr-alert-dialog-con ol{padding-left:15px}.socvr-alert-dialog-con.active{transform:none;opacity:1}.btn{background:#13a38d;border-radius:2em;color:#FFF;cursor:pointer;font-size:90%;padding:4px 7px}.btn:hover{background:#41af9e}";
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
        $.getJSON( checkUpdateURL, function( data ) {
            if(data.version > currentVersion) snackbar("SOCVR Alert [Update] "+data.version+" - "+data.summary+". Click here to update", function(){
                document.location = updateURL;
                $(".socvr-alert-snackbar").html("Click here to reload the page after updating").off("click").on("click",function(){
                    document.location.reload();
                });
            });
            else {
                if(GM_getValue("socvr-alert-version") < currentVersion || GM_getValue("socvr-alert-version") === undefined){
                    dialog("<p>"+data.summary+"</p><p><b>Changelog</b>:"+listify(data.changes)+"</p>","Updated SOCVR-Alert to Ver. "+data.version);
                    GM_getValue("socvr-alert-version", currentVersion);
                }
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

        $("<style></style>").html(styles).appendTo("body");
        $("body").append("<div class='socvr-alert-snackbar'></div>").append("<div class='socvr-alert-dialog'><div class='socvr-alert-dialog-back'></div><div class='socvr-alert-dialog-con'></div></div>");

        $(".socvr-alert-dialog-back").on("click",function(){
            $(this).siblings().removeClass("active").parent().fadeOut(function(){
                $(this).removeClass("active");
            });
        });

        checkForUpdates();

        try{
            if(setUp) watch(chat);
        } catch(e){
            snackbar("[Error] "+e.name + ': ' + e.message);
        }
    }


    $(function(){
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
                console.log("Smokey");
                var reason = getText(msg).split("]")[1].split(":")[0].replace(/^ */g,""),
                    url = "";

                $("a", msg).each(function(){
                    if( /^(http(s)?:\/\/|\/\/)(\w+\.)?(stackoverflow|stackexchange|askubuntu).com\/(questions|q|answers|a)\/\d+/.test($(this).attr("href"))) url = $(this).attr("href");
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
                this.close();
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

    function dialog(text, title){
        var dialog = $(".socvr-alert-dialog"),
            con = dialog.find(".socvr-alert-dialog-con");
        con.html("<h3>"+title+"</h3><p>"+text+"</p>");
        dialog.fadeIn(function(){
            $(con).addClass("active");
        }).addClass("active");
    }

    function getText(msg){
        return $(".content", msg).clone().children().remove().end().text().replace(/^ */g,"");
    }
    function listify(text){
        var ret = text.split(/[,;.]/).map(function(i){
            return (i!=="")?"<li>"+i.capitalizeFirstLetter()+".</li>":i;
        });
        ret.push("</ol>");
        ret.unshift("<ol>");
        return ret.join("");
    }

    String.prototype.capitalizeFirstLetter = function() {
        return this.charAt(0).toUpperCase() + this.slice(1);
    };

})();
