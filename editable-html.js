/**
 * Created by jjingmin on 1/16/2015.
 */
String.prototype.indexOfInsensitive = function(s, b) {
    return this.toLowerCase().indexOf(s.toLowerCase(), b);
};

$.fn.scrollTo = function(target, options, callback) {
    if ( typeof options == 'function' && arguments.length == 2) {
        callback = options;
        options = target;
    }
    var settings = $.extend({
        scrollTarget : target,
        offsetTop : 50,
        duration : 500,
        easing : 'swing'
    }, options);
    return this.each(function() {
        var scrollPane = $(this);
        var scrollTarget = ( typeof settings.scrollTarget == "number") ? settings.scrollTarget : $(settings.scrollTarget);
        var scrollY = ( typeof scrollTarget == "number") ? scrollTarget : scrollTarget.offset().top + scrollPane.scrollTop() - parseInt(settings.offsetTop);
        scrollPane.animate({
            scrollTop : scrollY
        }, parseInt(settings.duration), settings.easing, function() {
            if ( typeof callback == 'function') {
                callback.call(this);
            }
        });
    });
};

$.fn.editableTableWidget = function(options) {'use strict';
    return $(this).each(function() {
        var buildDefaultOptions = function() {
            var opts = $.extend({}, $.fn.editableTableWidget.defaultOptions);
            opts.editor = opts.editor.clone();
            return opts;
        }, activeOptions = $.extend(buildDefaultOptions(), options), ARROW_LEFT = 37, ARROW_UP = 38, ARROW_RIGHT = 39, ARROW_DOWN = 40, ENTER = 13, ESC = 27, TAB = 9, element = $(this), editor = activeOptions.editor.css('position', 'absolute').hide().appendTo(element.parent()), active, showEditor = function(select) {
            active = element.find('td:focus');
            if (active.length) {
                editor.val(active.text()).removeClass('error').show().offset(active.offset()).css(active.css(activeOptions.cloneProperties)).width(active.width()).height(active.height()).focus();
                if (select) {
                    editor.select();
                }
            }
        }, setActiveText = function() {
            var text = editor.val(), evt = $.Event('change'), originalContent;
            if (active.text() === text || editor.hasClass('error')) {
                return true;
            }
            originalContent = active.html();
            active.text(text).trigger(evt, text);
            if (evt.result === false) {
                active.html(originalContent);
                return false;
            }

            var tmp2 = editor.val();
            var keyMatchVar = WEB.KeywordOps.keywordMatch(tmp2);
            var addClassVar = "";
            if (keyMatchVar != "notKeyword") {
                addClassVar = "keywordColor";
            } else if (tmp2.search(/^\$/) != -1) {
                addClassVar = "variableColor";
            }
            active.addClass(addClassVar);

            WEB.JSONOps.updateJsonElement(editor.val());
            WEB.Action.updateGlobalState({"saved": false});
            WEB.Global.activeMode = 2;
            //Use blur event to write to json array
        }, movement = function(element, keycode) {
            if (keycode === ARROW_RIGHT) {
                return element.next('td');
            } else if (keycode === ARROW_LEFT) {
                return element.prev('td');
            } else if (keycode === ARROW_UP) {
                return element.parent().prev().children().eq(element.index());
            } else if (keycode === ARROW_DOWN) {
                return element.parent().next().children().eq(element.index());
            }
            return [];
        };
        editor.blur(function() {
            setActiveText();
            editor.hide();
        }).keydown(function(e) {
            if (e.which === ENTER) {
                setActiveText();
                editor.hide();
                active.focus();
                e.preventDefault();
                e.stopPropagation();
            } else if (e.which === ESC) {
                editor.val(active.text());
                e.preventDefault();
                e.stopPropagation();
                editor.hide();
                active.focus();
            } else if (e.which === TAB) {
                active.focus();
            } else if (this.selectionEnd - this.selectionStart === this.value.length) {
                var possibleMove = movement(active, e.which);
                if (possibleMove.length > 0) {
                    possibleMove.focus();
                    e.preventDefault();
                    e.stopPropagation();
                }
            }
        }).on('input paste', function() {
            var evt = $.Event('validate');
            active.trigger(evt, editor.val());
            if (evt.result === false) {
                editor.addClass('error');
            } else {
                editor.removeClass('error');
            }
        });
        element.on('click keypress dblclick', showEditor).css('cursor', 'pointer').keydown(function(e) {
            var prevent = true, possibleMove = movement($(e.target), e.which);
            if (possibleMove.length > 0) {
                possibleMove.focus();
            } else if (e.which === ENTER) {
                showEditor(false);
            } else if (e.which === 17 || e.which === 91 || e.which === 93) {
                showEditor(true);
                prevent = false;
            } else {
                prevent = false;
            }
            if (prevent) {
                e.stopPropagation();
                e.preventDefault();
            }
        });

        element.find('td').prop('tabindex', 1);

        $(window).on('resize', function() {
            if (editor.is(':visible')) {
                editor.offset(active.offset()).width(active.width()).height(active.height());
            }
        });
    });

};
$.fn.editableTableWidget.defaultOptions = {
    cloneProperties : ['padding', 'padding-top', 'padding-bottom', 'padding-left', 'padding-right', 'text-align', 'font', 'font-size', 'font-family', 'font-weight', 'border', 'border-top', 'border-bottom', 'border-left', 'border-right'],
    editor : $('<input>')
};

$.fn.editableWidget = function(options, callback) {'use strict';
    var editor, active, dataSource = [];

    return $(this).each(function() {
        var buildDefaultOptions = function() {
            var opts = $.extend({}, $.fn.editableWidget.defaultOptions);
            return opts;
        }, 
        activeOptions = $.extend(buildDefaultOptions(), options), 
        ARROW_LEFT = 37, 
        ARROW_UP = 38, 
        ARROW_RIGHT = 39, 
        ARROW_DOWN = 40, 
        ENTER = 13, 
        ESC = 27, 
        TAB = 9, 
        element = $(this),
        documentClickedCounter = 0;
        //active;

        var EventManager = {
            Editor: {
                keydown: function(e) {
                    if (e.which === ENTER) {
                        setActiveText();
                        editor.hide();
                        active.focus();
                        e.preventDefault();
                        e.stopPropagation();
                    } else if (e.which === ESC) {
                        editor.val(active.text());
                        e.preventDefault();
                        e.stopPropagation();
                        editor.hide();
                        active.focus();
                    } else if (e.which === TAB) {
                        active.focus();
                    } else if (this.selectionEnd - this.selectionStart === this.value.length) {
                        var possibleMove = movement(active, e.which);
                        if (possibleMove.length > 0) {
                            possibleMove.focus();
                            e.preventDefault();
                            e.stopPropagation();
                        }
                    }
                },
                blur: function() {
                    setActiveText();
                    editor.hide();
                },
                input_paste: function() {
                    var evt = $.Event('validate');
                    active.trigger(evt, editor.val());
                    if (evt.result === false) {
                        editor.addClass('error');
                    } else {
                        editor.removeClass('error');
                    }
                }
            },
            Document: {
                click: function(event) {
                    if ($(event.target).parents('.custom-combobox').length <= 0) {
                        documentClickedCounter ++;
                        if (documentClickedCounter == 2) {
                            documentClickedCounter = 0;
                            setActiveText();
                            editor.hide();
                            $(document).unbind("click", EventManager.Document.click);
                        }
                    }
                }
            },
            Element: {
                click_keypress_dblclick: function(e) {
                    var target = $(e.target);
                    if (target.hasClass('editable')) {
                        if(typeof activeOptions.source == 'string') {
                            if (dataSource.length > 0) {
                                showEditor(target);
                                EventManager.bind();
                                return true;
                            }

                            $.getJSON(activeOptions.source, function(data) {
                                if (typeof data != 'undefined' && data.code == 0) {
                                    for (var i=0; i<data.msg.length; i++) {
                                        dataSource.push(data.msg[i]);
                                    }

                                    showEditor(target);
                                    EventManager.bind();
                                }
                            });
                        } else {
                            if($.isFunction(activeOptions.source)) {
                                activeOptions.source(target, dataSource);
                            }

                            if($.isArray(activeOptions.source)) {
                                dataSource = activeOptions.source;
                            }

                            showEditor(target);
                            EventManager.bind();
                        }
                    }
                },
                keydown: function(e) {
                    var prevent = true, possibleMove = movement($(e.target), e.which);
                    if (possibleMove.length > 0) {
                        possibleMove.focus();
                    } else if (e.which === ENTER) {
                        showEditor($(e.target), false);
                    } else if (e.which === 17 || e.which === 91 || e.which === 93) {
                        showEditor($(e.target), true);
                        prevent = false;
                    } else {
                        prevent = false;
                    }
            
                    if (prevent) {
                        e.stopPropagation();
                        e.preventDefault();
                    }
                }    
            },
            bind: function() {
                if (typeof editor == 'undefined') {
                    return false;
                }
                var target;
                switch (active.attr('editor-type')) {
                    case 'combobox':
                    target = editor.children('span').children('input');
                    $(document).bind("click", EventManager.Document.click);
                    break;
                    //default case
                    default:
                    target = editor;                   
                }

                if (typeof element.attr('event-enabled') != 'undefined') {
                    return false;
                }

                target.unbind();
                target.bind({
                    "blur": EventManager.Editor.blur,
                    "keydown": EventManager.Editor.keydown,
                    "input": EventManager.Editor.input_paste,
                    "paste": EventManager.Editor.input_paste
                });

                element.attr('event-enabled', 'true');
            }
        };
        
        var showEditor = function(target, select) {
            if (typeof target == 'undefined') {
                return false;
            }

            active = target;
            var htmlStr, i;
            switch (active.attr('editor-type')) {
                case "combobox":
                    if (dataSource.length == 0) {
                        return false;
                    }
                    if (element.siblings('div').children('select').length == 0) {
                        htmlStr = '<div><select><option></option>';
                        for (i =0; i< dataSource.length; i++) {
                            htmlStr += "<option>" + dataSource[i] + "</option>";
                        }
                        htmlStr += "</select></div>";
                        editor = $(htmlStr).css({'position':'absolute'}).hide().appendTo(element.parent());
                        documentClickedCounter = 1;
                    } else {
                        editor = element.siblings('div');
                        htmlStr = '<select>';
                        for (i=0; i< dataSource.length; i++) {
                            htmlStr += "<option>" + dataSource[i] + "</option>";
                        }
                        htmlStr += "</select>";
                        editor.html(htmlStr);
                        //documentClickedCounter = 1;
                    }

                    editor.children('select').combobox();
                    editor.children('span').children('input').val(active.text()).focus();
                    if (select) {
                        editor.children('span').children('input').select();
                    }
                    break;
                default:
                    if (element.siblings('input').length == 0) {
                        editor = $('<input>').css('position', 'absolute').hide().appendTo(element.parent());
                    } else {
                        editor = element.siblings('input');
                    }
                    editor.val(active.text()).focus();
                    if (select) {
                        editor.select();
                    }
            }

            editor.removeClass('error').show().offset(active.offset()).css(active.css(activeOptions.cloneProperties)).width(active.width()).height(active.height()).focus();
            editor.css('padding', '0px').attr('editor-id', active.attr('id'));
        }, 
        setActiveText = function() {
            var text;
            if (typeof editor.attr('editor-id') != 'undefined') {
                active = $('#' + editor.attr('editor-id'));
            }

            switch(active.attr('editor-type')) {
                case 'combobox':
                    text = editor.find('input').val();
                    break;
                default:
                    text = editor.val();
            }
            var evt = $.Event('change'), originalContent;
            if (active.text() === text || editor.hasClass('error')) {
                return true;
            }
            originalContent = active.text();
            active.text(text).trigger(evt, text);
            if (evt.result === false) {
                active.text(originalContent);
                return false;
            }

            var tmp2 = text;
            var keyMatchVar = WEB.KeywordOps.keywordMatch(tmp2);
            var addClassVar = "";
            if (keyMatchVar != "notKeyword") {
                addClassVar = "keywordColor";
            } else if (tmp2.search(/^\$/) != -1) {
                addClassVar = "variableColor";
            }
            active.addClass(addClassVar);
            
            WEB.JSONOps.updateJsonElement(text);
            WEB.Action.updateGlobalState({"saved": false});
            WEB.Global.activeMode = 2;
            
            //Use blur event to write to json array
        }, 
        movement = function(element, keycode) {
            if (keycode === ARROW_RIGHT) {
                return element.next('.editable');
            } else if (keycode === ARROW_LEFT) {
                return element.prev('.editable');
            } else if (keycode === ARROW_UP) {
                return element.parent().prev().children().eq(element.index());
            } else if (keycode === ARROW_DOWN) {
                return element.parent().next().children().eq(element.index());
            }
            return [];
        };

        element.css('cursor', 'pointer');
        element.find('.editable').prop('tabindex', 1);
        if (typeof element.attr('event-enabled') == 'undefined') {
            element.bind({
                "click": EventManager.Element.click_keypress_dblclick,
                "keypress": EventManager.Element.click_keypress_dblclick,
                "dblclick": EventManager.Element.click_keypress_dblclick
            });
        }

        $(window).on('resize', function() {
            if (typeof editor == 'undefined') {
                return false;
            }

            if (editor.is(':visible')) {
                editor.offset(active.offset()).width(active.width()).height(active.height());
            }
        });
    });

};
$.fn.editableWidget.defaultOptions = {
    cloneProperties : ['padding', 'padding-top', 'padding-bottom', 'padding-left', 'padding-right', 'text-align', 'font', 'font-size', 'font-family', 'font-weight', 'border', 'border-top', 'border-bottom', 'border-left', 'border-right']
};

/*
 * the combobox extension of JQuery
 */
(function($) {
    $.widget("custom.combobox", {
        _create : function() {
            this.wrapper = $("<span>").addClass("custom-combobox").insertAfter(this.element);
            this.element.hide();
            this._createAutocomplete();
            this._createShowAllButton();
        },
        _createAutocomplete : function() {
            var selected = this.element.children(":selected"), value = selected.val() ? selected.text() : "";
            this.input = $("<input>").appendTo(this.wrapper).val(value).attr("title", "").addClass("custom-combobox-input ui-widget ui-widget-content ui-state-default ui-corner-left").autocomplete({
                delay : 0,
                minLength : 0,
                source : $.proxy(this, "_source")
            }).tooltip({
                tooltipClass : "ui-state-highlight"
            });
            this._on(this.input, {
                autocompleteselect : function(event, ui) {
                    ui.item.option.selected = true;
                    this._trigger("select", event, {
                        item : ui.item.option
                    });
                },
                autocompletechange : "_removeIfInvalid"
            });
        },
        _createShowAllButton : function() {
            var input = this.input, wasOpen = false;
            $("<a>").attr("tabIndex", -1).attr("title", "Show All Items").tooltip().appendTo(this.wrapper).button({
                icons : {
                    primary : "ui-icon-triangle-1-s"
                },
                text : false
            }).removeClass("ui-corner-all").addClass("custom-combobox-toggle ui-corner-right").mousedown(function() {
                wasOpen = input.autocomplete("widget").is(":visible");
            }).click(function() {
                input.focus();
                // Close if already visible
                if (wasOpen) {
                    return;
                }
                // Pass empty string as value to search for, displaying all results
                input.autocomplete("search", "");
            });
        },
        _source : function(request, response) {
            var matcher = new RegExp($.ui.autocomplete.escapeRegex(request.term), "i");
            response(this.element.children("option").map(function() {
                var text = $(this).text();
                if (this.value && (!request.term || matcher.test(text) ))
                    return {
                        label : text,
                        value : text,
                        option : this
                    };
            }));
        },
        _removeIfInvalid : function(event, ui) {
            // Selected an item, nothing to do
            if (ui.item) {
                return;
            }
            // Search for a match (case-insensitive)
            var value = this.input.val(), valueLowerCase = value.toLowerCase(), valid = false;
            this.element.children("option").each(function() {
                if ($(this).text().toLowerCase() === valueLowerCase) {
                    this.selected = valid = true;
                    return false;
                }
            });
            // Found a match, nothing to do
            if (valid) {
                return;
            }
            // Remove invalid value
            this.input.val("").attr("title", value + " didn't match any item").tooltip("open");
            this.element.val("");
            this._delay(function() {
                this.input.tooltip("close").attr("title", "");
            }, 2500);
            this.input.autocomplete("instance").term = "";
        },
        _destroy : function() {
            this.wrapper.remove();
            this.element.show();
        }
    });
})(jQuery);
