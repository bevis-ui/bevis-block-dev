modules.require(['jquery', 'bt', 'y-block'], function($, bt, YBlock) {
    var currentBlockName;
    var currentView;
    var currentBTJSON;
    var currentJS;
    var currentDesignSrc;
    var currentBG;
    var blocksListLinks = [];
    var viewListLinks = [];
    var blockHolder = $('.__block-holder');
    var btjsonInput = $('.__btjson');
    var jsInput = $('.__js');
    var srcInput = $('.__src');
    var bgInput = $('.__bg');
    var designFrame = $('.__design');
    var blockViews = {};

    $.when(parseStylesheet(), parseJS()).then(function () {
        buildBlockLinks();
        applyHashParams();
        window.onhashchange = applyHashParams;
    });

    function buildBlockLinks() {
        var blockList = $('.__block-list');
        var blocksAffected = {};
        Object.keys(bt._matchers).forEach(function (matcherName) {
            var blockName = matcherName.replace(/[_\*/].*$/, '');
            if (blockName.match(/y-example.*/) || blockName === 'y-ua' || blockName === 'y-page') {
                return;
            }
            if (blocksAffected[blockName]) {
                return;
            }
            blocksAffected[blockName] = true;
            var link = $('<a></a>');
            link.attr('href', '#block=' + encodeURIComponent(blockName));
            link.text(blockName);
            link.attr('title', blockName);
            blocksListLinks.push(link);
            blockList.append(link);
        });
    }

    function applyHashParams() {
        var hashParams = parseHash();
        if (hashParams.block !== currentBlockName) {
            buildViewLinks(hashParams.block);
        }
        if (hashParams.bg !== currentBG) {
            currentBG = hashParams.bg;
            $(document.body).css({background: currentBG || '#fff'});
        }
        if (hashParams.src !== currentDesignSrc) {
            currentDesignSrc = hashParams.src;
            if (currentDesignSrc) {
                designFrame.attr('src', currentDesignSrc);
                $(document.body).addClass('__show-design');
            } else {
                $(document.body).removeClass('__show-design');
            }
        }
        if (hashParams.block !== currentBlockName ||
            hashParams.btjson !== currentBTJSON ||
            hashParams.view !== currentView ||
            hashParams.js !== currentJS
        ) {
            currentBlockName = hashParams.block;
            currentBTJSON = hashParams.btjson;
            currentView = hashParams.view;
            currentJS = hashParams.js;
            emptyBlock();
            if (currentBlockName) {
                var error = false;
                if (currentJS) {
                    var jsFn;
                    try {
                        jsFn = new Function(currentJS);
                    } catch (e) {
                        handleError('Syntax error', currentJS);
                        error = true;
                    }
                    if (!error) {
                        try {
                            var block = jsFn();
                            if (!block instanceof YBlock) {
                                handleError('Should return instance of YBlock', currentJS);
                                error = true;
                            } else {
                                block.getDomNode().appendTo(blockHolder);
                            }
                        } catch(e) {
                            window.setTimeout(function() {
                                throw e;
                            }, 0);
                            handleError('Error creating block', currentJS);
                            error = true;
                        }
                    }
                } else {
                    var btjson = {block: currentBlockName};
                    if (currentView) {
                        btjson.view = currentView;
                    }
                    if (currentBTJSON) {
                        try {
                            var btjsonFn = new Function('return ' + currentBTJSON + ';');
                            btjson = btjsonFn();
                        } catch (e) {
                            handleError('BTJSON parse error', currentBTJSON);
                            error = true;
                        }
                    }
                    if (!error) {
                        var preRenderBtjson = JSON.stringify(btjson, null, 4);
                        try {
                            renderBlock(btjson);
                        } catch (e) {
                            handleError('Cannot render block', preRenderBtjson);
                        }
                    }
                }
                reposition();
            }
        }
        actualizeUI();
    }

    function buildViewLinks(blockName) {
        var viewList = $('.__view-list');
        viewList.empty();
        viewListLinks = [];
        if (blockName) {
            var views = blockViews[blockName] || [];
            views.forEach(function (view) {
                var link = $('<a></a>');
                link.attr(
                    'href',
                    '#block=' + encodeURIComponent(blockName) + '&view=' + encodeURIComponent(view)
                );
                link.text(view);
                link.attr('title', view);
                viewList.append(link);
                viewListLinks.push(link);
            });
        }
    }

    function actualizeUI() {
        blocksListLinks.concat(viewListLinks).forEach(function (link) {
            link.removeClass('__active');
        });
        if (currentBlockName) {
            blocksListLinks.forEach(function (link) {
                if (link.attr('href') === '#block=' + encodeURIComponent(currentBlockName)) {
                    link.addClass('__active');
                }
            });
        }
        if (currentView) {
            viewListLinks.forEach(function (link) {
                if (link.attr('href') === '#block=' + encodeURIComponent(currentBlockName) + '&view=' + encodeURIComponent(currentView)) {
                    link.addClass('__active');
                }
            });
        }
        btjsonInput.val(currentBTJSON || '');
        jsInput.val(currentJS || '');
        bgInput.val(currentBG || '');
        srcInput.val(currentDesignSrc || '');
    }

    function handleError(errorMessage, code) {
        var errorElem = $('<div class="__error-message"></div>');
        var headerElem = $('<div class="__panel-header"></div>');
        headerElem.text(errorMessage);
        errorElem.append(headerElem);
        if (code) {
            var codeElem = $('<pre class="__error-message-code"></pre>');
            codeElem.text(code);
            errorElem.append(codeElem);
        }
        blockHolder.append(errorElem);
        reposition();
    }

    function renderBlock(btjson) {
        blockHolder.html(bt.apply(btjson));
        YBlock.initDomTree(blockHolder);
    }

    function emptyBlock() {
        YBlock.destructDomTree(blockHolder);
        blockHolder.empty();
    }

    function reposition() {
        blockHolder.css({left: 0, top: 0});
        blockHolder.css('margin-top', -blockHolder.height() / 2);
        blockHolder.css('margin-left', -blockHolder.width() / 2);
        blockHolder.css({left: '50%', top: '50%'});
    }

    btjsonInput.blur(setHashParam.bind(btjsonInput, 'btjson'));
    jsInput.blur(setHashParam.bind(jsInput, 'js'));
    srcInput.blur(setHashParam.bind(srcInput, 'src'));
    bgInput.blur(setHashParam.bind(bgInput, 'bg'));

    function setHashParam(paramName) {
        var value = this.val().trim();
        var hash = parseHash();
        if (value) {
            hash[paramName] = value;
        } else {
            delete hash[paramName];
        }
        setHash(hash);
    }

    function parseHash() {
        var result = {};
        var hash = window.location.hash;
        hash = (hash || '').replace(/^#/, '');
        var keyValuePairs = hash.split('&');
        keyValuePairs.forEach(function (keyValuePair) {
            var pair = keyValuePair.split('=');
            if (pair.length === 2) {
                result[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1]);
            }
        });
        return result;
    }

    function setHash(hashValues) {
        var result = [];
        Object.keys(hashValues).forEach(function (key) {
            result.push(encodeURIComponent(key) + '=' + encodeURIComponent(hashValues[key]));
        });
        window.location.hash = '#' + result.join('&');
    }

    function parseStylesheet() {
        return $.ajax({url: $('#__project-stylesheet').attr('href')}).then(function (data) {
            var regex = /\.([a-z\-0-9]+)_([a-z\-0-9]+)[^a-z\-0-9]/g;
            var match;
            var added = {};
            while (match = regex.exec(data)) {
                var blockName = match[1];
                var viewName = match[2];
                if (added[blockName + '_' + viewName]) {
                    continue;
                }
                added[blockName + '_' + viewName] = true;
                blockViews[blockName] = blockViews[blockName] || [];
                blockViews[blockName].push(viewName);
            }
            Object.keys(blockViews).forEach(function (key) {
                blockViews[key].sort(function (a, b) {
                    return a === b ? 0 : (a > b ? 1 : -1);
                });
            });
        });
    }

    function parseJS() {
        return $.ajax({url: $('#__project-javascript').attr('src')}).then(function (data) {
            var dataLine = data.split('\n').join('');
            var regex = /modules\.define\s*\(\s*['"]([^'"]+)['"]/g;
            var match;
            var moduleNames = [];
            while (match = regex.exec(dataLine)) {
                moduleNames.push(match[1]);
            }
            return $.when.apply($, moduleNames.map(function (moduleName) {
                var defer = new $.Deferred();
                modules.require(moduleName, function(res) {
                    var objectName = moduleName.replace(/(?:\-|__)([a-z])/g, function(s, g) {
                        return g.toUpperCase();
                    });
                    window[objectName] = res;
                    window[objectName.charAt(0).toUpperCase() + objectName.substr(1)] = res;
                    defer.resolve();
                }, function() {
                    defer.resolve();
                });
                return defer.promise();
            }));
        });
    }
});
