// ==UserScript==
// @name         Chat-styles
// @namespace    https://github.com/Jacob-Gray/SE-Userscripts/
// @version      1
// @description  Change the default theme of the SE chats
// @author       Jacob Gray
// @match        http://chat.stackoverflow.com/*
// @match        http://chat.stackexchange.com/*
// @match        http://chat.meta.stackexchange.com/*
// ==/UserScript==

(function() {
    'use strict';

    $("head").append("<link rel=\"stylesheet\" type=\"text/css\" href=\"https://rawgit.com/Jacob-Gray/SE-Userscripts/master/chat-styles/chat-styles.css\">");
})();
