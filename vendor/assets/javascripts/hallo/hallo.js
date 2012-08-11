(function() {
  /*
  Hallo {{ VERSION }} - a rich text editing jQuery UI widget
  (c) 2011 Henri Bergius, IKS Consortium
  Hallo may be freely distributed under the MIT license
  http://hallojs.org
  */  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };
  (function(jQuery) {
    return jQuery.widget("IKS.hallo", {
      toolbar: null,
      bound: false,
      originalContent: "",
      previousContent: "",
      uuid: "",
      selection: null,
      _keepActivated: false,
      originalHref: null,
      options: {
        editable: true,
        plugins: {},
        toolbar: 'halloToolbarContextual',
        parentElement: 'body',
        buttonCssClass: null,
        placeholder: '',
        forceStructured: true,
        checkTouch: true,
        touchScreen: null
      },
      _create: function() {
        var options, plugin, _ref;
        this.id = this._generateUUID();
        if (this.options.checkTouch && this.options.touchScreen === null) {
          this.checkTouch();
        }
        _ref = this.options.plugins;
        for (plugin in _ref) {
          options = _ref[plugin];
          if (!jQuery.isPlainObject(options)) {
            options = {};
          }
          jQuery.extend(options, {
            editable: this,
            uuid: this.id,
            buttonCssClass: this.options.buttonCssClass
          });
          jQuery(this.element)[plugin](options);
        }
        this.element.one('halloactivated', __bind(function() {
          return this._prepareToolbar();
        }, this));
        return this.originalContent = this.getContents();
      },
      _init: function() {
        if (this.options.editable) {
          return this.enable();
        } else {
          return this.disable();
        }
      },
      disable: function() {
        this.element.attr("contentEditable", false);
        this.element.unbind("focus", this._activated);
        this.element.unbind("blur", this._deactivated);
        this.element.unbind("keyup paste change", this._checkModified);
        this.element.unbind("keyup", this._keys);
        this.element.unbind("keyup mouseup", this._checkSelection);
        this.bound = false;
        jQuery(this.element).removeClass('isModified');
        this.element.parents('a').andSelf().each(__bind(function(idx, elem) {
          var element;
          element = jQuery(elem);
          if (!element.is('a')) {
            return;
          }
          if (!this.originalHref) {
            return;
          }
          return element.attr('href', this.originalHref);
        }, this));
        return this._trigger("disabled", null);
      },
      enable: function() {
        var widget;
        this.element.parents('a[href]').andSelf().each(__bind(function(idx, elem) {
          var element;
          element = jQuery(elem);
          if (!element.is('a[href]')) {
            return;
          }
          this.originalHref = element.attr('href');
          return element.removeAttr('href');
        }, this));
        this.element.attr("contentEditable", true);
        if (!this.element.html()) {
          this.element.html(this.options.placeholder);
        }
        if (!this.bound) {
          this.element.bind("focus", this, this._activated);
          this.element.bind("blur", this, this._deactivated);
          this.element.bind("keyup paste change", this, this._checkModified);
          this.element.bind("keyup", this, this._keys);
          this.element.bind("keyup mouseup", this, this._checkSelection);
          widget = this;
          this.bound = true;
        }
        if (this.options.forceStructured) {
          this._forceStructured();
        }
        return this._trigger("enabled", null);
      },
      activate: function() {
        return this.element.focus();
      },
      containsSelection: function() {
        var range;
        range = this.getSelection();
        return this.element.has(range.startContainer).length > 0;
      },
      getSelection: function() {
        var range, sel;
        sel = rangy.getSelection();
        range = null;
        if (sel.rangeCount > 0) {
          range = sel.getRangeAt(0);
        } else {
          range = rangy.createRange();
        }
        return range;
      },
      restoreSelection: function(range) {
        var sel;
        sel = rangy.getSelection();
        return sel.setSingleRange(range);
      },
      replaceSelection: function(cb) {
        var newTextNode, r, range, sel, t;
        if (jQuery.browser.msie) {
          t = document.selection.createRange().text;
          r = document.selection.createRange();
          return r.pasteHTML(cb(t));
        } else {
          sel = window.getSelection();
          range = sel.getRangeAt(0);
          newTextNode = document.createTextNode(cb(range.extractContents()));
          range.insertNode(newTextNode);
          range.setStartAfter(newTextNode);
          sel.removeAllRanges();
          return sel.addRange(range);
        }
      },
      removeAllSelections: function() {
        if (jQuery.browser.msie) {
          return range.empty();
        } else {
          return window.getSelection().removeAllRanges();
        }
      },
      getContents: function() {
        var contentClone, plugin;
        contentClone = this.element.clone();
        for (plugin in this.options.plugins) {
          if (!jQuery.isFunction(jQuery(this.element).data(plugin)['cleanupContentClone'])) {
            continue;
          }
          jQuery(this.element)[plugin]('cleanupContentClone', contentClone);
        }
        return contentClone.html();
      },
      setContents: function(contents) {
        return this.element.html(contents);
      },
      isModified: function() {
        if (!this.previousContent) {
          this.previousContent = this.originalContent;
        }
        return this.previousContent !== this.getContents();
      },
      setUnmodified: function() {
        return this.previousContent = this.getContents();
      },
      setModified: function() {
        jQuery(this.element).addClass('isModified');
        return this._trigger('modified', null, {
          editable: this,
          content: this.getContents()
        });
      },
      restoreOriginalContent: function() {
        return this.element.html(this.originalContent);
      },
      execute: function(command, value) {
        if (document.execCommand(command, false, value)) {
          return this.element.trigger("change");
        }
      },
      protectFocusFrom: function(el) {
        var widget;
        widget = this;
        return el.bind("mousedown", function(event) {
          event.preventDefault();
          widget._protectToolbarFocus = true;
          return setTimeout(function() {
            return widget._protectToolbarFocus = false;
          }, 300);
        });
      },
      keepActivated: function(_keepActivated) {
        this._keepActivated = _keepActivated;
      },
      _generateUUID: function() {
        var S4;
        S4 = function() {
          return ((1 + Math.random()) * 0x10000 | 0).toString(16).substring(1);
        };
        return "" + (S4()) + (S4()) + "-" + (S4()) + "-" + (S4()) + "-" + (S4()) + "-" + (S4()) + (S4()) + (S4());
      },
      _prepareToolbar: function() {
        var plugin;
        this.toolbar = jQuery('<div class="hallotoolbar"></div>').hide();
        jQuery(this.element)[this.options.toolbar]({
          editable: this,
          parentElement: this.options.parentElement,
          toolbar: this.toolbar
        });
        for (plugin in this.options.plugins) {
          jQuery(this.element)[plugin]('populateToolbar', this.toolbar);
        }
        jQuery(this.element)[this.options.toolbar]('setPosition');
        return this.protectFocusFrom(this.toolbar);
      },
      _checkModified: function(event) {
        var widget;
        widget = event.data;
        if (widget.isModified()) {
          return widget.setModified();
        }
      },
      _keys: function(event) {
        var old, widget;
        widget = event.data;
        if (event.keyCode === 27) {
          old = widget.getContents();
          widget.restoreOriginalContent(event);
          widget._trigger("restored", null, {
            editable: widget,
            content: widget.getContents(),
            thrown: old
          });
          return widget.turnOff();
        }
      },
      _rangesEqual: function(r1, r2) {
        return r1.startContainer === r2.startContainer && r1.startOffset === r2.startOffset && r1.endContainer === r2.endContainer && r1.endOffset === r2.endOffset;
      },
      _checkSelection: function(event) {
        var widget;
        if (event.keyCode === 27) {
          return;
        }
        widget = event.data;
        return setTimeout(function() {
          var sel;
          sel = widget.getSelection();
          if (widget._isEmptySelection(sel) || widget._isEmptyRange(sel)) {
            if (widget.selection) {
              widget.selection = null;
              widget._trigger("unselected", null, {
                editable: widget,
                originalEvent: event
              });
            }
            return;
          }
          if (!widget.selection || !widget._rangesEqual(sel, widget.selection)) {
            widget.selection = sel.cloneRange();
            return widget._trigger("selected", null, {
              editable: widget,
              selection: widget.selection,
              ranges: [widget.selection],
              originalEvent: event
            });
          }
        }, 0);
      },
      _isEmptySelection: function(selection) {
        if (selection.type === "Caret") {
          return true;
        }
        return false;
      },
      _isEmptyRange: function(range) {
        if (range.collapsed) {
          return true;
        }
        if (range.isCollapsed) {
          if (typeof range.isCollapsed === 'function') {
            return range.isCollapsed();
          }
          return range.isCollapsed;
        }
        return false;
      },
      turnOn: function() {
        if (this.getContents() === this.options.placeholder) {
          this.setContents('');
        }
        jQuery(this.element).addClass('inEditMode');
        return this._trigger("activated", this);
      },
      turnOff: function() {
        jQuery(this.element).removeClass('inEditMode');
        this._trigger("deactivated", this);
        if (!this.getContents()) {
          return this.setContents(this.options.placeholder);
        }
      },
      _activated: function(event) {
        return event.data.turnOn();
      },
      _deactivated: function(event) {
        if (event.data._keepActivated) {
          return;
        }
        if (event.data._protectToolbarFocus !== true) {
          return event.data.turnOff();
        } else {
          return setTimeout(function() {
            return jQuery(event.data.element).focus();
          }, 300);
        }
      },
      _forceStructured: function(event) {
        try {
          return document.execCommand('styleWithCSS', 0, false);
        } catch (e) {
          try {
            return document.execCommand('useCSS', 0, true);
          } catch (e) {
            try {
              return document.execCommand('styleWithCSS', false, false);
            } catch (e) {

            }
          }
        }
      },
      checkTouch: function() {
        return this.options.touchScreen = !!('createTouch' in document);
      }
    });
  })(jQuery);
  (function(jQuery) {
    var z;
    z = null;
    if (this.VIE !== void 0) {
      z = new VIE;
      z.use(new z.StanbolService({
        proxyDisabled: true,
        url: 'http://dev.iks-project.eu:8081'
      }));
    }
    return jQuery.widget('IKS.halloannotate', {
      options: {
        vie: z,
        editable: null,
        toolbar: null,
        uuid: '',
        select: function() {},
        decline: function() {},
        remove: function() {},
        buttonCssClass: null
      },
      _create: function() {
        var editableElement, turnOffAnnotate, widget;
        widget = this;
        if (this.options.vie === void 0) {
          throw 'The halloannotate plugin requires VIE to be loaded';
          return;
        }
        if (typeof this.element.annotate !== 'function') {
          throw 'The halloannotate plugin requires annotate.js to be loaded';
          return;
        }
        this.state = 'off';
        this.instantiate();
        turnOffAnnotate = function() {
          var editable;
          editable = this;
          return jQuery(editable).halloannotate('turnOff');
        };
        editableElement = this.options.editable.element;
        return editableElement.bind('hallodisabled', turnOffAnnotate);
      },
      populateToolbar: function(toolbar) {
        var buttonHolder;
        buttonHolder = jQuery("<span class=\"" + this.widgetName + "\"></span>");
        this.button = buttonHolder.hallobutton({
          label: 'Annotate',
          icon: 'icon-tags',
          editable: this.options.editable,
          command: null,
          uuid: this.options.uuid,
          cssClass: this.options.buttonCssClass,
          queryState: false
        });
        buttonHolder.bind('change', __bind(function(event) {
          if (this.state === "pending") {
            return;
          }
          if (this.state === "off") {
            return this.turnOn();
          }
          return this.turnOff();
        }, this));
        buttonHolder.buttonset();
        return toolbar.append(this.button);
      },
      cleanupContentClone: function(el) {
        if (this.state === 'on') {
          return el.find(".entity:not([about])").each(function() {
            return jQuery(this).replaceWith(jQuery(this).html());
          });
        }
      },
      instantiate: function() {
        var widget;
        widget = this;
        return this.options.editable.element.annotate({
          vie: this.options.vie,
          debug: false,
          showTooltip: true,
          select: this.options.select,
          remove: this.options.remove,
          success: this.options.success,
          error: this.options.error
        }).bind('annotateselect', function(event, data) {
          return widget.options.editable.setModified();
        }).bind('annotateremove', function() {
          return jQuery.noop();
        });
      },
      turnPending: function() {
        this.state = 'pending';
        this.button.hallobutton('checked', false);
        return this.button.hallobutton('disable');
      },
      turnOn: function() {
        var widget;
        this.turnPending();
        widget = this;
        try {
          return this.options.editable.element.annotate('enable', __bind(function(success) {
            if (success) {
              this.state = 'on';
              this.button.hallobutton('checked', true);
              return this.button.hallobutton('enable');
            }
          }, this));
        } catch (e) {
          return alert(e);
        }
      },
      turnOff: function() {
        this.options.editable.element.annotate('disable');
        this.state = 'off';
        if (!this.button) {
          return;
        }
        this.button.attr('checked', false);
        this.button.find("label").removeClass("ui-state-clicked");
        return this.button.button('refresh');
      }
    });
  })(jQuery);
  (function(jQuery) {
    return jQuery.widget('IKS.halloblock', {
      options: {
        editable: null,
        toolbar: null,
        uuid: '',
        elements: ['h1', 'h2', 'h3', 'p', 'pre', 'blockquote'],
        buttonCssClass: null
      },
      populateToolbar: function(toolbar) {
        var buttonset, contentId, target;
        buttonset = jQuery("<span class=\"" + this.widgetName + "\"></span>");
        contentId = "" + this.options.uuid + "-" + this.widgetName + "-data";
        target = this._prepareDropdown(contentId);
        buttonset.append(target);
        buttonset.append(this._prepareButton(target));
        return toolbar.append(buttonset);
      },
      _prepareDropdown: function(contentId) {
        var addElement, containingElement, contentArea, element, _i, _len, _ref;
        contentArea = jQuery("<div id=\"" + contentId + "\"></div>");
        containingElement = this.options.editable.element.get(0).tagName.toLowerCase();
        addElement = __bind(function(element) {
          var el, queryState;
          el = jQuery("<button class='blockselector'><" + element + " class=\"menu-item\">" + element + "</" + element + "></button>");
          if (containingElement === element) {
            el.addClass('selected');
          }
          if (containingElement !== 'div') {
            el.addClass('disabled');
          }
          el.bind('click', __bind(function() {
            if (el.hasClass('disabled')) {
              return;
            }
            if (jQuery.browser.msie) {
              return this.options.editable.execute('FormatBlock', '<' + element.toUpperCase() + '>');
            } else {
              return this.options.editable.execute('formatBlock', element.toUpperCase());
            }
          }, this));
          queryState = __bind(function(event) {
            var block;
            block = document.queryCommandValue('formatBlock');
            if (block.toLowerCase() === element) {
              el.addClass('selected');
              return;
            }
            return el.removeClass('selected');
          }, this);
          this.options.editable.element.bind('keyup paste change mouseup', queryState);
          this.options.editable.element.bind('halloenabled', __bind(function() {
            return this.options.editable.element.bind('keyup paste change mouseup', queryState);
          }, this));
          this.options.editable.element.bind('hallodisabled', __bind(function() {
            return this.options.editable.element.unbind('keyup paste change mouseup', queryState);
          }, this));
          return el;
        }, this);
        _ref = this.options.elements;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          element = _ref[_i];
          contentArea.append(addElement(element));
        }
        return contentArea;
      },
      _prepareButton: function(target) {
        var buttonElement;
        buttonElement = jQuery('<span></span>');
        buttonElement.hallodropdownbutton({
          uuid: this.options.uuid,
          editable: this.options.editable,
          label: 'block',
          icon: 'icon-text-height',
          target: target,
          cssClass: this.options.buttonCssClass
        });
        return buttonElement;
      }
    });
  })(jQuery);
  (function(jQuery) {
    return jQuery.widget("IKS.halloformat", {
      options: {
        editable: null,
        uuid: "",
        formattings: {
          bold: true,
          italic: true,
          strikeThrough: false,
          underline: false
        },
        buttonCssClass: null
      },
      populateToolbar: function(toolbar) {
        var buttonize, buttonset, enabled, format, widget, _ref;
        widget = this;
        buttonset = jQuery("<span class=\"" + widget.widgetName + "\"></span>");
        buttonize = __bind(function(format) {
          var buttonHolder;
          buttonHolder = jQuery('<span></span>');
          buttonHolder.hallobutton({
            label: format,
            editable: this.options.editable,
            command: format,
            uuid: this.options.uuid,
            cssClass: this.options.buttonCssClass
          });
          return buttonset.append(buttonHolder);
        }, this);
        _ref = this.options.formattings;
        for (format in _ref) {
          enabled = _ref[format];
          if (enabled) {
            buttonize(format);
          }
        }
        buttonset.hallobuttonset();
        return toolbar.append(buttonset);
      }
    });
  })(jQuery);
  (function(jQuery) {
    return jQuery.widget("IKS.halloheadings", {
      options: {
        editable: null,
        toolbar: null,
        uuid: "",
        headers: [1, 2, 3]
      },
      populateToolbar: function(toolbar) {
        var button, buttonize, buttonset, header, id, label, widget, _i, _len, _ref;
        widget = this;
        buttonset = jQuery("<span class=\"" + widget.widgetName + "\"></span>");
        id = "" + this.options.uuid + "-paragraph";
        label = "P";
        buttonset.append(jQuery("<input id=\"" + id + "\" type=\"radio\" name=\"" + widget.options.uuid + "-headings\"/><label for=\"" + id + "\" class=\"p_button\">" + label + "</label>").button());
        button = jQuery("#" + id, buttonset);
        button.attr("hallo-command", "formatBlock");
        button.bind("change", function(event) {
          var cmd;
          cmd = jQuery(this).attr("hallo-command");
          return widget.options.editable.execute(cmd, "P");
        });
        buttonize = __bind(function(headerSize) {
          label = "H" + headerSize;
          id = "" + this.options.uuid + "-" + headerSize;
          buttonset.append(jQuery("<input id=\"" + id + "\" type=\"radio\" name=\"" + widget.options.uuid + "-headings\"/><label for=\"" + id + "\" class=\"h" + headerSize + "_button\">" + label + "</label>").button());
          button = jQuery("#" + id, buttonset);
          button.attr("hallo-size", "H" + headerSize);
          return button.bind("change", function(event) {
            var size;
            size = jQuery(this).attr("hallo-size");
            return widget.options.editable.execute("formatBlock", size);
          });
        }, this);
        _ref = this.options.headers;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          header = _ref[_i];
          buttonize(header);
        }
        buttonset.buttonset();
        this.element.bind("keyup paste change mouseup", function(event) {
          var format, formatNumber, labelParent, matches, selectedButton;
          try {
            format = document.queryCommandValue("formatBlock").toUpperCase();
          } catch (e) {
            format = '';
          }
          if (format === "P") {
            selectedButton = jQuery("#" + widget.options.uuid + "-paragraph");
          } else if (matches = format.match(/\d/)) {
            formatNumber = matches[0];
            selectedButton = jQuery("#" + widget.options.uuid + "-" + formatNumber);
          }
          labelParent = jQuery(buttonset);
          labelParent.children("input").attr("checked", false);
          labelParent.children("label").removeClass("ui-state-clicked");
          labelParent.children("input").button("widget").button("refresh");
          if (selectedButton) {
            selectedButton.attr("checked", true);
            selectedButton.next("label").addClass("ui-state-clicked");
            return selectedButton.button("refresh");
          }
        });
        return toolbar.append(buttonset);
      },
      _init: function() {}
    });
  })(jQuery);
  (function(jQuery) {
    return jQuery.widget('IKS.halloimagecurrent', {
      options: {
        imageWidget: null,
        startPlace: '',
        draggables: [],
        maxWidth: 400,
        maxHeight: 200
      },
      _create: function() {
        this.element.html('<div>\
        <div class="activeImageContainer">\
          <div class="rotationWrapper">\
            <div class="hintArrow"></div>\
              <img src="" class="activeImage" />\
            </div>\
            <img src="" class="activeImage activeImageBg" />\
          </div>\
          <div class="metadata" style="display: none;">\
            <input type="text" class="caption" name="caption" />\
          </div>\
        </div>');
        this.element.hide();
        return this._prepareDnD();
      },
      _init: function() {
        var editable, widget;
        editable = jQuery(this.options.editable.element);
        widget = this;
        jQuery('img', editable).each(function(index, elem) {
          elem.contentEditable = false;
          return widget._initDraggable(elem, editable);
        });
        return jQuery('p', editable).each(function(index, elem) {
          if (jQuery(elem).data('jquery_droppable_initialized')) {
            return;
          }
          jQuery(elem).droppable({
            tolerance: 'pointer',
            drop: function(event, ui) {
              return widget._handleDropEvent(event, ui);
            },
            over: function(event, ui) {
              return widget._handleOverEvent(event, ui);
            },
            out: function(event, ui) {
              return widget._handleLeaveEvent(event, ui);
            }
          });
          return jQuery(elem).data('jquery_droppable_initialized', true);
        });
      },
      _prepareDnD: function() {
        var editable, overlayMiddleConfig, widget;
        widget = this;
        editable = jQuery(this.options.editable.element);
        this.options.offset = editable.offset();
        this.options.third = parseFloat(editable.width() / 3);
        overlayMiddleConfig = {
          width: this.options.third,
          height: editable.height()
        };
        this.overlay = {
          big: jQuery("<div/>").addClass("bigOverlay").css({
            width: this.options.third * 2,
            height: editable.height()
          }),
          left: jQuery("<div/>").addClass("smallOverlay smallOverlayLeft").css(overlayMiddleConfig),
          right: jQuery("<div/>").addClass("smallOverlay smallOverlayRight").css(overlayMiddleConfig).css("left", this.options.third * 2)
        };
        editable.bind('halloactivated', function() {
          return widget._enableDragging();
        });
        return editable.bind('hallodeactivated', function() {
          return widget._disableDragging();
        });
      },
      setImage: function(image) {
        if (!image) {
          return;
        }
        this.element.show();
        jQuery('.activeImage', this.element).attr('src', image.url);
        if (image.label) {
          jQuery('input', this.element).val(image.label);
          jQuery('.metadata', this.element).show();
        }
        return this._initImage(jQuery(this.options.editable.element));
      },
      _delayAction: function(functionToCall, delay) {
        var timer;
        timer = clearTimeout(timer);
        if (!timer) {
          return timer = setTimeout(functionToCall, delay);
        }
      },
      _calcDropPosition: function(offset, event) {
        var position;
        position = offset.left + this.options.third;
        if (event.pageX >= position && event.pageX <= (offset.left + this.options.third * 2)) {
          return 'middle';
        } else if (event.pageX < position) {
          return 'left';
        } else if (event.pageX > (offset.left + this.options.third * 2)) {
          return 'right';
        }
      },
      _createInsertElement: function(image, tmp) {
        var imageInsert, maxHeight, maxWidth, tmpImg;
        imageInsert = jQuery('<img>');
        tmpImg = new Image();
        maxWidth = this.options.maxWidth;
        maxHeight = this.options.maxHeight;
        jQuery(tmpImg).bind('load', function() {
          var height, ratio, width;
          width = tmpImg.width;
          height = tmpImg.height;
          if (width > maxWidth || height > maxHeight) {
            if (width > height) {
              ratio = (tmpImg.width / maxWidth).toFixed();
            } else {
              ratio = (tmpImg.height / maxHeight).toFixed();
            }
            width = (tmpImg.width / ratio).toFixed();
            height = (tmpImg.height / ratio).toFixed();
          }
          return imageInsert.attr({
            width: width,
            height: height
          });
        });
        tmpImg.src = image.src;
        imageInsert.attr({
          src: tmpImg.src,
          alt: !tmp ? jQuery(image).attr('alt') : void 0,
          "class": tmp ? 'halloTmp' : ''
        });
        imageInsert.show();
        return imageInsert;
      },
      _createLineFeedbackElement: function() {
        return jQuery('<div/>').addClass('halloTmpLine');
      },
      _removeFeedbackElements: function() {
        return jQuery('.halloTmp, .halloTmpLine', this.options.editable.element).remove();
      },
      _removeCustomHelper: function() {
        return jQuery('.customHelper').remove();
      },
      _showOverlay: function(position) {
        var eHeight, editable;
        editable = jQuery(this.options.editable.element);
        eHeight = editable.height() + parseFloat(editable.css('paddingTop')) + parseFloat(editable.css('paddingBottom'));
        this.overlay.big.css({
          height: eHeight
        });
        this.overlay.left.css({
          height: eHeight
        });
        this.overlay.right.css({
          height: eHeight
        });
        switch (position) {
          case 'left':
            this.overlay.big.addClass("bigOverlayLeft").removeClass("bigOverlayRight").css({
              left: this.options.third
            }).show();
            this.overlay.left.hide();
            return this.overlay.right.hide();
          case 'middle':
            this.overlay.big.removeClass("bigOverlayLeft bigOverlayRight");
            this.overlay.big.hide();
            this.overlay.left.show();
            return this.overlay.right.show();
          case 'right':
            this.overlay.big.addClass("bigOverlayRight").removeClass("bigOverlayLeft").css({
              left: 0
            }).show();
            this.overlay.left.hide();
            return this.overlay.right.hide();
        }
      },
      _checkOrigin: function(event) {
        if (jQuery(event.target).parents("[contenteditable]").length !== 0) {
          return true;
        }
        return false;
      },
      _createTmpFeedback: function(image, position) {
        var el;
        if (position === 'middle') {
          return this._createLineFeedbackElement();
        }
        el = this._createInsertElement(image, true);
        return el.addClass("inlineImage-" + position);
      },
      _handleOverEvent: function(event, ui) {
        var editable, postPone, widget;
        widget = this;
        editable = jQuery(this.options.editable);
        postPone = function() {
          var position;
          window.waitWithTrash = clearTimeout(window.waitWithTrash);
          position = widget._calcDropPosition(widget.options.offset, event);
          jQuery('.trashcan', ui.helper).remove();
          editable.append(widget.overlay.big);
          editable.append(widget.overlay.left);
          editable.append(widget.overlay.right);
          widget._removeFeedbackElements();
          jQuery(event.target).prepend(widget._createTmpFeedback(ui.draggable[0], position));
          if (position === 'middle') {
            jQuery(event.target).prepend(widget._createTmpFeedback(ui.draggable[0], 'right'));
            jQuery('.halloTmp', event.target).hide();
          } else {
            jQuery(event.target).prepend(widget._createTmpFeedback(ui.draggable[0], 'middle'));
            jQuery('.halloTmpLine', event.target).hide();
          }
          return widget._showOverlay(position);
        };
        return setTimeout(postPone, 5);
      },
      _handleDragEvent: function(event, ui) {
        var position, tmpFeedbackLR, tmpFeedbackMiddle;
        position = this._calcDropPosition(this.options.offset, event);
        if (position === this._lastPositionDrag) {
          return;
        }
        this._lastPositionDrag = position;
        tmpFeedbackLR = jQuery('.halloTmp', this.options.editable.element);
        tmpFeedbackMiddle = jQuery('.halloTmpLine', this.options.editable.element);
        if (position === 'middle') {
          tmpFeedbackMiddle.show();
          tmpFeedbackLR.hide();
        } else {
          tmpFeedbackMiddle.hide();
          tmpFeedbackLR.removeClass('inlineImage-left inlineImage-right').addClass("inlineImage-" + position).show();
        }
        return this._showOverlay(position);
      },
      _handleLeaveEvent: function(event, ui) {
        var func;
        func = function() {
          if (!jQuery('div.trashcan', ui.helper).length) {
            jQuery(ui.helper).append(jQuery('<div class="trashcan"></div>'));
            return jQuery('.bigOverlay, .smallOverlay').remove();
          }
        };
        window.waitWithTrash = setTimeout(func, 200);
        return this._removeFeedbackElements();
      },
      _handleStartEvent: function(event, ui) {
        var internalDrop;
        internalDrop = this._checkOrigin(event);
        if (internalDrop) {
          jQuery(event.target).remove();
        }
        jQuery(document).trigger('startPreventSave');
        return this.options.startPlace = jQuery(event.target);
      },
      _handleStopEvent: function(event, ui) {
        var internalDrop;
        internalDrop = this._checkOrigin(event);
        if (internalDrop) {
          jQuery(event.target).remove();
        } else {
          jQuery(this.options.editable.element).trigger('change');
        }
        this.overlay.big.hide();
        this.overlay.left.hide();
        this.overlay.right.hide();
        return jQuery(document).trigger('stopPreventSave');
      },
      _handleDropEvent: function(event, ui) {
        var editable, imageInsert, internalDrop, position;
        editable = jQuery(this.options.editable.element);
        internalDrop = this._checkOrigin(event);
        position = this._calcDropPosition(this.options.offset, event);
        this._removeFeedbackElements();
        this._removeCustomHelper();
        imageInsert = this._createInsertElement(ui.draggable[0], false);
        if (position === 'middle') {
          imageInsert.show();
          imageInsert.removeClass('inlineImage-middle inlineImage-left inlineImage-right');
          imageInsert.addClass("inlineImage-" + position).css({
            position: 'relative',
            left: ((editable.width() + parseFloat(editable.css('paddingLeft')) + parseFloat(editable.css('paddingRight'))) - imageInsert.attr('width')) / 2
          });
          imageInsert.insertBefore(jQuery(event.target));
        } else {
          imageInsert.removeClass('inlineImage-middle inlineImage-left inlineImage-right');
          imageInsert.addClass("inlineImage-" + position);
          imageInsert.css('display', 'block');
          jQuery(event.target).prepend(imageInsert);
        }
        this.overlay.big.hide();
        this.overlay.left.hide();
        this.overlay.right.hide();
        editable.trigger('change');
        return this._initImage(editable);
      },
      _createHelper: function(event) {
        return jQuery('<div>').css({
          backgroundImage: "url(" + (jQuery(event.currentTarget).attr('src')) + ")"
        }).addClass('customHelper').appendTo('body');
      },
      _initDraggable: function(elem, editable) {
        var widget;
        widget = this;
        if (!elem.jquery_draggable_initialized) {
          elem.jquery_draggable_initialized = true;
          jQuery(elem).draggable({
            cursor: 'move',
            helper: function(event) {
              return widget._createHelper(event);
            },
            drag: function(event, ui) {
              return widget._handleDragEvent(event, ui);
            },
            start: function(event, ui) {
              return widget._handleStartEvent(event, ui);
            },
            stop: function(event, ui) {
              return widget._handleStopEvent(event, ui);
            },
            disabled: !editable.hasClass('inEditMode'),
            cursorAt: {
              top: 50,
              left: 50
            }
          });
        }
        return widget.options.draggables.push(elem);
      },
      _initImage: function(editable) {
        var widget;
        widget = this;
        return jQuery('.rotationWrapper img', this.options.dialog).each(function(index, elem) {
          return widget._initDraggable(elem, editable);
        });
      },
      _enableDragging: function() {
        return jQuery.each(this.options.draggables, function(index, d) {
          return jQuery(d).draggable('option', 'disabled', false);
        });
      },
      _disableDragging: function() {
        return jQuery.each(this.options.draggables, function(index, d) {
          return jQuery(d).draggable('option', 'disabled', true);
        });
      }
    });
  })(jQuery);
  (function(jQuery) {
    return jQuery.widget('IKS.halloimagesearch', {
      options: {
        imageWidget: null,
        searchCallback: null,
        searchUrl: null,
        limit: 5
      },
      _create: function() {
        return this.element.html('<div>\
        <form method="get">\
          <input type="text" class="searchInput" />\
          <input type="submit" class="btn searchButton" value="OK" />\
        </form>\
        <div class="searchResults imageThumbnailContainer">\
          <div class="activitySpinner">Loading images...</div>\
          <ul></ul>\
        </div>\
      </div>');
      },
      _init: function() {
        var widget;
        widget = this;
        if (widget.options.searchUrl && !widget.options.searchCallback) {
          widget.options.searchCallback = widget._ajaxSearch;
        }
        jQuery('.activitySpinner', this.element).hide();
        return jQuery('form', this.element).submit(function(event) {
          var query;
          event.preventDefault();
          jQuery('.activitySpinner', this.element).show();
          query = jQuery('.searchInput', widget.element).val();
          return widget.options.searchCallback(query, widget.options.limit, 0, function(results) {
            return widget._showResults(results);
          });
        });
      },
      _showResult: function(image) {
        var html;
        if (!image.label) {
          image.label = image.alt;
        }
        html = jQuery("<li><img src=\"" + image.url + "\" class=\"imageThumbnail\" title=\"" + image.label + "\"></li>");
        html.bind('click', __bind(function() {
          return this.options.imageWidget.setCurrent(image);
        }, this));
        jQuery('img', html).bind('mousedown', __bind(function(event) {
          event.preventDefault();
          return this.options.imageWidget.setCurrent(image);
        }, this));
        return jQuery('.imageThumbnailContainer ul', this.element).append(html);
      },
      _showNextPrev: function(results) {
        var container, widget;
        widget = this;
        container = jQuery('imageThumbnailContainer ul', this.element);
        container.prepend(jQuery('<div class="pager-prev" style="display:none"></div>'));
        container.append(jQuery('<div class="pager-next" style="display:none"></div>'));
        if (results.offset > 0) {
          jQuery('.pager-prev', container).show();
        }
        if (results.offset < results.total) {
          jQuery('.pager-next', container).show();
        }
        jQuery('.pager-prev', container).click(function(event) {
          return widget.options.searchCallback(query, widget.options.limit, response.offset - widget.options.limit, function(results) {
            return widget._showResults(results);
          });
        });
        return jQuery('.pager-next', container).click(function(event) {
          return widget.options.searchCallback(query, widget.options.limit, response.offset + widget.options.limit, function(results) {
            return widget._showResults(results);
          });
        });
      },
      _showResults: function(results) {
        var image, _i, _len, _ref;
        jQuery('.activitySpinner', this.element).hide();
        jQuery('.imageThumbnailContainer ul', this.element).empty();
        jQuery('.imageThumbnailContainer ul', this.element).show();
        _ref = results.assets;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          image = _ref[_i];
          this._showResult(image);
        }
        this.options.imageWidget.setCurrent(results.assets.shift());
        return this._showNextPrev(results);
      },
      _ajaxSearch: function(query, limit, offset, success) {
        var searchUrl;
        searchUrl = this.searchUrl + '?' + jQuery.param({
          q: query,
          limit: limit,
          offset: offset
        });
        return jQuery.getJSON(searchUrl, success);
      }
    });
  })(jQuery);
  (function(jQuery) {
    return jQuery.widget('IKS.halloimagesuggestions', {
      loaded: false,
      options: {
        entity: null,
        vie: null,
        dbPediaUrl: null,
        getSuggestions: null
      },
      _create: function() {
        return this.element.html('\
      <div id="' + this.options.uuid + '-tab-suggestions">\
        <div class="imageThumbnailContainer">\
          <div class="activitySpinner">Loading images...</div>\
          <ul></ul>\
        </div>\
      </div>');
      },
      _init: function() {
        return jQuery('.activitySpinner', this.element).hide();
      },
      _normalizeRelated: function(related) {
        if (_.isString(related)) {
          return related;
        }
        if (_.isArray(related)) {
          return related.join(',');
        }
        return related.pluck('@subject').join(',');
      },
      _prepareVIE: function() {
        if (!this.options.vie) {
          this.options.vie = new VIE;
        }
        if (this.options.vie.services.dbpedia) {
          return;
        }
        if (!this.options.dbPediaUrl) {
          return;
        }
        return this.options.vie.use(new vie.DBPediaService({
          url: this.options.dbPediaUrl,
          proxyDisabled: true
        }));
      },
      _getSuggestions: function() {
        var normalizedTags, tags;
        if (this.loaded) {
          return;
        }
        if (!this.options.entity) {
          return;
        }
        jQuery('.activitySpinner', this.element).show();
        tags = this.options.entity.get('skos:related');
        if (tags.length === 0) {
          jQuery("#activitySpinner").html('No images found.');
          return;
        }
        jQuery('.imageThumbnailContainer ul', this.element).empty();
        normalizedTags = this._normalizeRelated(tags);
        if (this.options.getSuggestions) {
          this.options.getSuggestions(normalizedTags, widget.options.limit, 0, this._showSuggestions);
        }
        this._prepareVIE();
        if (this.options.vie.services.dbpedia) {
          this._getSuggestionsDbPedia(tags);
        }
        return this.loaded = true;
      },
      _getSuggestionsDbPedia: function(tags) {
        var thumbId, widget;
        widget = this;
        thumbId = 1;
        return _.each(tags, function(tag) {
          return vie.load({
            entity: tag
          }).using('dbpedia').execute().done(function(entities) {
            jQuery('.activitySpinner', this.element).hide();
            return _.each(entities, function(entity) {
              var img, thumbnail;
              thumbnail = entity.attributes['<http://dbpedia.org/ontology/thumbnail>'];
              if (!thumbnail) {
                return;
              }
              if (_.isObject(thumbnail)) {
                img = thumbnail[0].value;
              }
              if (_.isString(thumbnail)) {
                img = widget.options.entity.fromReference(thumbnail);
              }
              return widget._showSuggestion({
                url: img,
                label: tag
              });
            });
          });
        });
      },
      _showSuggestion: function(image) {
        var html;
        html = jQuery("<li><img src=\"" + image.url + "\" class=\"imageThumbnail\" title=\"" + image.label + "\"></li>");
        html.bind('click', __bind(function() {
          return this.options.imageWidget.setCurrent(image);
        }, this));
        return jQuery('.imageThumbnailContainer ul', this.element).append(html);
      },
      _showSuggestions: function(suggestions) {
        jQuery('.activitySpinner', this.element).hide();
        return _.each(suggestions, __bind(function(image) {
          return this._showSuggestion(image);
        }, this));
      }
    });
  })(jQuery);
  (function(jQuery) {
    return jQuery.widget('IKS.halloimageupload', {
      options: {
        uploadCallback: null,
        uploadUrl: null,
        imageWidget: null,
        entity: null
      },
      _create: function() {
        return this.element.html('\
        <form class="upload">\
          <input type="file" class="file" name="userfile" accept="image/*" />\
          <input type="hidden" name="tags" value="" />\
          <button class="uploadSubmit">Upload</button>\
        </form>\
      ');
      },
      _init: function() {
        var widget;
        widget = this;
        if (widget.options.uploadUrl && !widget.options.uploadCallback) {
          widget.options.uploadCallback = widget._iframeUpload;
        }
        return jQuery('.uploadSubmit', this.element).bind('click', function(event) {
          event.preventDefault();
          event.stopPropagation();
          return widget.options.uploadCallback({
            widget: widget,
            success: function(url) {
              return widget.options.imageWidget.setCurrent({
                url: url,
                label: ''
              });
            }
          });
        });
      },
      _prepareIframe: function(widget) {
        var iframe, iframeName;
        iframeName = ("" + widget.widgetName + "_postframe_" + widget.options.uuid).replace(/-/g, '_');
        iframe = jQuery("#" + iframeName);
        if (iframe.length) {
          return iframe;
        }
        iframe = jQuery("<iframe name=\"" + iframeName + "\" id=\"" + iframeName + "\" class=\"hidden\" style=\"display:none\" />");
        this.element.append(iframe);
        iframe.get(0).name = iframeName;
        return iframe;
      },
      _iframeUpload: function(data) {
        var iframe, uploadForm, uploadUrl, widget;
        widget = data.widget;
        iframe = widget._prepareIframe(widget);
        uploadForm = jQuery('form.upload', widget.element);
        if (typeof widget.options.uploadUrl === 'function') {
          uploadUrl = widget.options.uploadUrl(widget.options.entity);
        } else {
          uploadUrl = widget.options.uploadUrl;
        }
        iframe.bind('load', function() {
          var imageUrl;
          imageUrl = iframe.get(0).contentWindow.location.href;
          widget.element.hide();
          return data.success(imageUrl);
        });
        uploadForm.attr('action', uploadUrl);
        uploadForm.attr('method', 'post');
        uploadForm.attr('target', iframe.get(0).name);
        uploadForm.attr('enctype', 'multipart/form-data');
        uploadForm.attr('encoding', 'multipart/form-data');
        return uploadForm.submit();
      }
    });
  })(jQuery);
  (function(jQuery) {
    return jQuery.widget("Liip.halloimage", {
      options: {
        editable: null,
        toolbar: null,
        uuid: "",
        limit: 8,
        search: null,
        searchUrl: null,
        suggestions: null,
        loaded: null,
        upload: null,
        uploadUrl: null,
        dialogOpts: {
          autoOpen: false,
          width: 270,
          height: "auto",
          title: "Insert Images",
          modal: false,
          resizable: false,
          draggable: true,
          dialogClass: 'halloimage-dialog'
        },
        dialog: null,
        buttonCssClass: null,
        entity: null,
        vie: null,
        dbPediaUrl: "http://dev.iks-project.eu/stanbolfull",
        maxWidth: 250,
        maxHeight: 250
      },
      populateToolbar: function(toolbar) {
        var buttonHolder, buttonset, dialogId, id, widget;
        this.options.toolbar = toolbar;
        widget = this;
        dialogId = "" + this.options.uuid + "-image-dialog";
        this.options.dialog = jQuery("<div id=\"" + dialogId + "\">                <div class=\"nav\">                    <ul class=\"tabs\">                    </ul>                    <div id=\"" + this.options.uuid + "-tab-activeIndicator\" class=\"tab-activeIndicator\" />                </div>                <div class=\"dialogcontent\">            </div>");
        if (widget.options.suggestions) {
          this._addGuiTabSuggestions(jQuery(".tabs", this.options.dialog), jQuery(".dialogcontent", this.options.dialog));
        }
        if (widget.options.search || widget.options.searchUrl) {
          this._addGuiTabSearch(jQuery(".tabs", this.options.dialog), jQuery(".dialogcontent", this.options.dialog));
        }
        if (widget.options.upload || widget.options.uploadUrl) {
          this._addGuiTabUpload(jQuery(".tabs", this.options.dialog), jQuery(".dialogcontent", this.options.dialog));
        }
        this.current = jQuery('<div class="currentImage"></div>').halloimagecurrent({
          uuid: this.options.uuid,
          imageWidget: this,
          editable: this.options.editable,
          dialog: this.options.dialog,
          maxWidth: this.options.maxWidth,
          maxHeight: this.options.maxHeight
        });
        jQuery('.dialogcontent', this.options.dialog).append(this.current);
        buttonset = jQuery("<span class=\"" + widget.widgetName + "\"></span>");
        id = "" + this.options.uuid + "-image";
        buttonHolder = jQuery('<span></span>');
        buttonHolder.hallobutton({
          label: 'Images',
          icon: 'icon-picture',
          editable: this.options.editable,
          command: null,
          queryState: false,
          uuid: this.options.uuid,
          cssClass: this.options.buttonCssClass
        });
        buttonset.append(buttonHolder);
        this.button = buttonHolder;
        this.button.bind("click", function(event) {
          if (widget.options.dialog.dialog("isOpen")) {
            widget._closeDialog();
          } else {
            widget._openDialog();
          }
          return false;
        });
        this.options.editable.element.bind("hallodeactivated", function(event) {
          return widget._closeDialog();
        });
        jQuery(this.options.editable.element).delegate("img", "click", function(event) {
          return widget._openDialog();
        });
        buttonset.buttonset();
        toolbar.append(buttonset);
        this.options.dialog.dialog(this.options.dialogOpts);
        return this._handleTabs();
      },
      setCurrent: function(image) {
        return this.current.halloimagecurrent('setImage', image);
      },
      _handleTabs: function() {
        var widget;
        widget = this;
        jQuery('.nav li', this.options.dialog).bind('click', function() {
          var id;
          jQuery("." + widget.widgetName + "-tab").hide();
          id = jQuery(this).attr('id');
          jQuery("#" + id + "-content").show();
          return jQuery("#" + widget.options.uuid + "-tab-activeIndicator").css("margin-left", jQuery(this).position().left + (jQuery(this).width() / 2));
        });
        return jQuery('.nav li', this.options.dialog).first().click();
      },
      _openDialog: function() {
        var cleanUp, widget, xposition, yposition;
        widget = this;
        cleanUp = function() {
          return window.setTimeout(function() {
            var thumbnails;
            thumbnails = jQuery(".imageThumbnail");
            return jQuery(thumbnails).each(function() {
              var size;
              size = jQuery("#" + this.id).width();
              if (size <= 20) {
                return jQuery("#" + this.id).parent("li").remove();
              }
            });
          }, 15000);
        };
        jQuery("#" + this.options.uuid + "-sugg-activeImage").attr("src", jQuery("#" + this.options.uuid + "-tab-suggestions-content .imageThumbnailActive").first().attr("src"));
        jQuery("#" + this.options.uuid + "-sugg-activeImageBg").attr("src", jQuery("#" + this.options.uuid + "-tab-suggestions-content .imageThumbnailActive").first().attr("src"));
        this.lastSelection = this.options.editable.getSelection();
        xposition = jQuery(this.options.editable.element).offset().left + jQuery(this.options.editable.element).outerWidth() - 3;
        yposition = jQuery(this.options.toolbar).offset().top - jQuery(document).scrollTop() - 29;
        this.options.dialog.dialog("option", "position", [xposition, yposition]);
        cleanUp();
        widget.options.loaded = 1;
        this.options.editable.keepActivated(true);
        this.options.dialog.dialog("open");
        return this.options.dialog.bind('dialogclose', __bind(function() {
          jQuery('label', this.button).removeClass('ui-state-active');
          this.options.editable.element.focus();
          return this.options.editable.keepActivated(false);
        }, this));
      },
      _closeDialog: function() {
        return this.options.dialog.dialog("close");
      },
      _addGuiTabSuggestions: function(tabs, element) {
        var tab;
        tabs.append(jQuery("<li id=\"" + this.options.uuid + "-tab-upload\" class=\"" + this.widgetName + "-tabselector " + this.widgetName + "-tab-upload\"><span>Upload</span></li>"));
        tab = jQuery("<div id=\"" + this.options.uuid + "-tab-upload-content\" class=\"" + this.widgetName + "-tab tab-upload\"></div>");
        element.append(tab);
        return tab.halloimagesuggestions({
          uuid: this.options.uuid,
          imageWidget: this,
          entity: this.options.entity
        });
      },
      _addGuiTabSearch: function(tabs, element) {
        var dialogId, tab, widget;
        widget = this;
        dialogId = "" + this.options.uuid + "-image-dialog";
        tabs.append(jQuery("<li id=\"" + this.options.uuid + "-tab-search\" class=\"" + widget.widgetName + "-tabselector " + widget.widgetName + "-tab-search\"><span>Search</span></li>"));
        tab = jQuery("<div id=\"" + this.options.uuid + "-tab-search-content\" class=\"" + widget.widgetName + "-tab tab-search\"></div>");
        element.append(tab);
        return tab.halloimagesearch({
          uuid: this.options.uuid,
          imageWidget: this,
          searchCallback: this.options.search,
          searchUrl: this.options.searchUrl,
          limit: this.options.limit,
          entity: this.options.entity
        });
      },
      _addGuiTabUpload: function(tabs, element) {
        var tab;
        tabs.append(jQuery("<li id=\"" + this.options.uuid + "-tab-upload\" class=\"" + this.widgetName + "-tabselector " + this.widgetName + "-tab-upload\"><span>Upload</span></li>"));
        tab = jQuery("<div id=\"" + this.options.uuid + "-tab-upload-content\" class=\"" + this.widgetName + "-tab tab-upload\"></div>");
        element.append(tab);
        return tab.halloimageupload({
          uuid: this.options.uuid,
          uploadCallback: this.options.upload,
          uploadUrl: this.options.uploadUrl,
          imageWidget: this,
          entity: this.options.entity
        });
        /*
                    insertImage = () ->
                        #This may need to insert an image that does not have the same URL as the preview image, since it may be a different size
        
                        # Check if we have a selection and fall back to @lastSelection otherwise
                        try
                            if not widget.options.editable.getSelection()
                                throw new Error "SelectionNotSet"
                        catch error
                            widget.options.editable.restoreSelection(widget.lastSelection)
        
                        document.execCommand "insertImage", null, jQuery(this).attr('src')
                        img = document.getSelection().anchorNode.firstChild
                        jQuery(img).attr "alt", jQuery(".caption").value
        
                        triggerModified = () ->
                            widget.element.trigger "hallomodified"
                        window.setTimeout triggerModified, 100
                        widget._closeDialog()
        
                    @options.dialog.find(".halloimage-activeImage, ##{widget.options.uuid}-#{widget.widgetName}-addimage").click insertImage
                    */
      }
    });
  })(jQuery);
  (function(jQuery) {
    return jQuery.widget('IKS.halloindicator', {
      options: {
        editable: null,
        className: 'halloEditIndicator'
      },
      _create: function() {
        var editButton;
        editButton = jQuery('<div><i class="icon-edit"></i> Edit</div>');
        editButton.addClass(this.options.className);
        editButton.hide();
        this.element.before(editButton);
        this.bindIndicator(editButton);
        return this.setIndicatorPosition(editButton);
      },
      bindIndicator: function(indicator) {
        indicator.bind('click', __bind(function() {
          return this.options.editable.element.focus();
        }, this));
        this.element.bind('halloactivated', function() {
          return indicator.hide();
        });
        return this.options.editable.element.hover(function() {
          if (jQuery(this).hasClass('inEditMode')) {
            return;
          }
          return indicator.show();
        }, function(data) {
          if (jQuery(this).hasClass('inEditMode')) {
            return;
          }
          if (data.relatedTarget === indicator.get(0)) {
            return;
          }
          return indicator.hide();
        });
      },
      setIndicatorPosition: function(indicator) {
        var offset;
        indicator.css('position', 'absolute');
        offset = this.element.position();
        indicator.css('top', offset.top + 2);
        return indicator.css('left', offset.left + 2);
      }
    });
  })(jQuery);
  (function(jQuery) {
    return jQuery.widget("IKS.hallojustify", {
      options: {
        editable: null,
        toolbar: null,
        uuid: '',
        buttonCssClass: null
      },
      populateToolbar: function(toolbar) {
        var buttonize, buttonset;
        buttonset = jQuery("<span class=\"" + this.widgetName + "\"></span>");
        buttonize = __bind(function(alignment) {
          var buttonElement;
          buttonElement = jQuery('<span></span>');
          buttonElement.hallobutton({
            uuid: this.options.uuid,
            editable: this.options.editable,
            label: alignment,
            command: "justify" + alignment,
            icon: "icon-align-" + (alignment.toLowerCase()),
            cssClass: this.options.buttonCssClass
          });
          return buttonset.append(buttonElement);
        }, this);
        buttonize("Left");
        buttonize("Center");
        buttonize("Right");
        buttonset.hallobuttonset();
        return toolbar.append(buttonset);
      },
      _init: function() {}
    });
  })(jQuery);
  (function(jQuery) {
    return jQuery.widget("IKS.hallolink", {
      options: {
        editable: null,
        uuid: "",
        link: true,
        image: true,
        defaultUrl: 'http://',
        dialogOpts: {
          autoOpen: false,
          width: 540,
          height: 95,
          title: "Enter Link",
          modal: true,
          resizable: false,
          draggable: false,
          dialogClass: 'hallolink-dialog'
        },
        butonCssClass: null
      },
      populateToolbar: function(toolbar) {
        var buttonize, buttonset, dialog, dialogId, dialogSubmitCb, urlInput, widget;
        widget = this;
        dialogId = "" + this.options.uuid + "-dialog";
        dialog = jQuery("<div id=\"" + dialogId + "\"><form action=\"#\" method=\"post\" class=\"linkForm\"><input class=\"url\" type=\"text\" name=\"url\" value=\"" + this.options.defaultUrl + "\" /><input type=\"submit\" id=\"addlinkButton\" value=\"Insert\" /></form></div>");
        urlInput = jQuery('input[name=url]', dialog).focus(function(e) {
          return this.select();
        });
        dialogSubmitCb = function(event) {
          var link;
          event.preventDefault();
          link = urlInput.val();
          widget.options.editable.restoreSelection(widget.lastSelection);
          if (((new RegExp(/^\s*$/)).test(link)) || link === widget.options.defaultUrl) {
            if (widget.lastSelection.collapsed) {
              widget.lastSelection.setStartBefore(widget.lastSelection.startContainer);
              widget.lastSelection.setEndAfter(widget.lastSelection.startContainer);
              window.getSelection().addRange(widget.lastSelection);
            }
            document.execCommand("unlink", null, "");
          } else {
            if (widget.lastSelection.startContainer.parentNode.href === void 0) {
              document.execCommand("createLink", null, link);
            } else {
              widget.lastSelection.startContainer.parentNode.href = link;
            }
          }
          widget.options.editable.element.trigger('change');
          widget.options.editable.removeAllSelections();
          dialog.dialog('close');
          return false;
        };
        dialog.find("form").submit(dialogSubmitCb);
        buttonset = jQuery("<span class=\"" + widget.widgetName + "\"></span>");
        buttonize = __bind(function(type) {
          var button, buttonHolder, id;
          id = "" + this.options.uuid + "-" + type;
          buttonHolder = jQuery('<span></span>');
          buttonHolder.hallobutton({
            label: 'Link',
            icon: 'icon-link',
            editable: this.options.editable,
            command: null,
            queryState: false,
            uuid: this.options.uuid,
            cssClass: this.options.buttonCssClass
          });
          buttonset.append(buttonHolder);
          button = buttonHolder;
          button.bind("click", function(event) {
            widget.lastSelection = widget.options.editable.getSelection();
            urlInput = jQuery('input[name=url]', dialog);
            if (widget.lastSelection.startContainer.parentNode.href === void 0) {
              urlInput.val(widget.options.defaultUrl);
            } else {
              urlInput.val(jQuery(widget.lastSelection.startContainer.parentNode).attr('href'));
              jQuery(urlInput[0].form).find('input[type=submit]').val('update');
            }
            widget.options.editable.keepActivated(true);
            dialog.dialog('open');
            dialog.bind('dialogclose', function() {
              jQuery('label', buttonHolder).removeClass('ui-state-active');
              widget.options.editable.element.focus();
              return widget.options.editable.keepActivated(false);
            });
            return false;
          });
          return this.element.bind("keyup paste change mouseup", function(event) {
            var nodeName, start;
            start = jQuery(widget.options.editable.getSelection().startContainer);
            nodeName = start.prop('nodeName') ? start.prop('nodeName') : start.parent().prop('nodeName');
            if (nodeName && nodeName.toUpperCase() === "A") {
              jQuery('label', button).addClass('ui-state-active');
              return;
            }
            return jQuery('label', button).removeClass('ui-state-active');
          });
        }, this);
        if (this.options.link) {
          buttonize("A");
        }
        if (this.options.link) {
          buttonset.buttonset();
          toolbar.append(buttonset);
          return dialog.dialog(this.options.dialogOpts);
        }
      },
      _init: function() {}
    });
  })(jQuery);
  (function(jQuery) {
    return jQuery.widget("IKS.hallolists", {
      options: {
        editable: null,
        toolbar: null,
        uuid: '',
        lists: {
          ordered: true,
          unordered: true
        },
        buttonCssClass: null
      },
      populateToolbar: function(toolbar) {
        var buttonize, buttonset;
        buttonset = jQuery("<span class=\"" + this.widgetName + "\"></span>");
        buttonize = __bind(function(type, label) {
          var buttonElement;
          buttonElement = jQuery('<span></span>');
          buttonElement.hallobutton({
            uuid: this.options.uuid,
            editable: this.options.editable,
            label: label,
            command: "insert" + type + "List",
            icon: "icon-list-" + (label.toLowerCase()),
            cssClass: this.options.buttonCssClass
          });
          return buttonset.append(buttonElement);
        }, this);
        if (this.options.lists.ordered) {
          buttonize("Ordered", "OL");
        }
        if (this.options.lists.unordered) {
          buttonize("Unordered", "UL");
        }
        buttonset.hallobuttonset();
        return toolbar.append(buttonset);
      }
    });
  })(jQuery);
  (function(jQuery) {
    return jQuery.widget("Liip.hallooverlay", {
      options: {
        editable: null,
        toolbar: null,
        uuid: "",
        overlay: null,
        padding: 10,
        background: null
      },
      _create: function() {
        var widget;
        widget = this;
        if (!this.options.bound) {
          this.options.bound = true;
          widget.options.editable.element.bind("halloactivated", function(event, data) {
            widget.options.currentEditable = jQuery(event.target);
            if (!widget.options.visible) {
              return widget.showOverlay();
            }
          });
          widget.options.editable.element.bind("hallomodified", function(event, data) {
            widget.options.currentEditable = jQuery(event.target);
            if (widget.options.visible) {
              return widget.resizeOverlay();
            }
          });
          return widget.options.editable.element.bind("hallodeactivated", function(event, data) {
            widget.options.currentEditable = jQuery(event.target);
            if (widget.options.visible) {
              return widget.hideOverlay();
            }
          });
        }
      },
      _init: function() {},
      showOverlay: function() {
        this.options.visible = true;
        if (this.options.overlay === null) {
          if (jQuery("#halloOverlay").length > 0) {
            this.options.overlay = jQuery("#halloOverlay");
          } else {
            this.options.overlay = jQuery('<div id="halloOverlay" class="halloOverlay">');
            jQuery(document.body).append(this.options.overlay);
          }
          this.options.overlay.bind('click', jQuery.proxy(this.options.editable.turnOff, this.options.editable));
        }
        this.options.overlay.show();
        if (this.options.background === null) {
          if (jQuery("#halloBackground").length > 0) {
            this.options.background = jQuery("#halloBackground");
          } else {
            this.options.background = jQuery('<div id="halloBackground" class="halloBackground">');
            jQuery(document.body).append(this.options.background);
          }
        }
        this.resizeOverlay();
        this.options.background.show();
        if (!this.options.originalZIndex) {
          this.options.originalZIndex = this.options.currentEditable.css("z-index");
        }
        return this.options.currentEditable.css('z-index', '350');
      },
      resizeOverlay: function() {
        var offset;
        offset = this.options.currentEditable.offset();
        this.options.background.css({
          top: offset.top - this.options.padding,
          left: offset.left - this.options.padding
        });
        this.options.background.width(this.options.currentEditable.width() + 2 * this.options.padding);
        return this.options.background.height(this.options.currentEditable.height() + 2 * this.options.padding);
      },
      hideOverlay: function() {
        this.options.visible = false;
        this.options.overlay.hide();
        this.options.background.hide();
        return this.options.currentEditable.css('z-index', this.options.originalZIndex);
      },
      _findBackgroundColor: function(jQueryfield) {
        var color;
        color = jQueryfield.css("background-color");
        if (color !== 'rgba(0, 0, 0, 0)' && color !== 'transparent') {
          return color;
        }
        if (jQueryfield.is("body")) {
          return "white";
        } else {
          return this._findBackgroundColor(jQueryfield.parent());
        }
      }
    });
  })(jQuery);
  (function(jQuery) {
    return jQuery.widget("IKS.halloreundo", {
      options: {
        editable: null,
        toolbar: null,
        uuid: '',
        buttonCssClass: null
      },
      populateToolbar: function(toolbar) {
        var buttonize, buttonset;
        buttonset = jQuery("<span class=\"" + this.widgetName + "\"></span>");
        buttonize = __bind(function(cmd, label) {
          var buttonElement;
          buttonElement = jQuery('<span></span>');
          buttonElement.hallobutton({
            uuid: this.options.uuid,
            editable: this.options.editable,
            label: label,
            icon: cmd === 'undo' ? 'icon-undo' : 'icon-repeat',
            command: cmd,
            queryState: false,
            cssClass: this.options.buttonCssClass
          });
          return buttonset.append(buttonElement);
        }, this);
        buttonize("undo", "Undo");
        buttonize("redo", "Redo");
        buttonset.hallobuttonset();
        return toolbar.append(buttonset);
      },
      _init: function() {}
    });
  })(jQuery);
  (function(jQuery) {
    return jQuery.widget("Liip.hallotoolbarlinebreak", {
      options: {
        editable: null,
        uuid: "",
        breakAfter: []
      },
      populateToolbar: function(toolbar) {
        var buttonset, buttonsets, queuedButtonsets, row, rowcounter, _i, _j, _len, _len2, _ref;
        buttonsets = jQuery('.ui-buttonset', toolbar);
        queuedButtonsets = jQuery();
        rowcounter = 0;
        _ref = this.options.breakAfter;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          row = _ref[_i];
          rowcounter++;
          for (_j = 0, _len2 = buttonsets.length; _j < _len2; _j++) {
            buttonset = buttonsets[_j];
            queuedButtonsets = jQuery(queuedButtonsets).add(jQuery(buttonset));
            if (jQuery(buttonset).hasClass(row)) {
              queuedButtonsets.wrapAll('<div class="halloButtonrow halloButtonrow-' + rowcounter + '" />');
              buttonsets = buttonsets.not(queuedButtonsets);
              queuedButtonsets = jQuery();
              break;
            }
          }
        }
        if (buttonsets.length > 0) {
          rowcounter++;
          return buttonsets.wrapAll('<div class="halloButtonrow halloButtonrow-' + rowcounter + '" />');
        }
      },
      _init: function() {}
    });
  })(jQuery);
  (function(jQuery) {
    return jQuery.widget('Hallo.halloToolbarContextual', {
      toolbar: null,
      options: {
        parentElement: 'body',
        editable: null,
        toolbar: null
      },
      _create: function() {
        this.toolbar = this.options.toolbar;
        jQuery(this.options.parentElement).append(this.toolbar);
        this._bindEvents();
        return jQuery(window).resize(__bind(function(event) {
          return this._updatePosition(this._getPosition(event));
        }, this));
      },
      _getPosition: function(event, selection) {
        var eventType, position;
        if (!event) {
          return;
        }
        eventType = event.type;
        if (eventType === "keydown" || eventType === "keyup" || eventType === "keypress") {
          return this._getCaretPosition(selection);
        }
        if (eventType === "click" || eventType === "mousedown" || eventType === "mouseup") {
          return position = {
            top: event.pageY,
            left: event.pageX
          };
        }
      },
      _getCaretPosition: function(range) {
        var newRange, position, tmpSpan;
        tmpSpan = jQuery("<span/>");
        newRange = rangy.createRange();
        newRange.setStart(range.endContainer, range.endOffset);
        newRange.insertNode(tmpSpan.get(0));
        position = {
          top: tmpSpan.offset().top,
          left: tmpSpan.offset().left
        };
        tmpSpan.remove();
        return position;
      },
      setPosition: function() {
        if (this.options.parentElement !== 'body') {
          this.options.parentElement = 'body';
          jQuery(this.options.parentElement).append(this.toolbar);
        }
        this.toolbar.css('position', 'absolute');
        this.toolbar.css('top', this.element.offset().top - 20);
        return this.toolbar.css('left', this.element.offset().left);
      },
      _updatePosition: function(position) {
        if (!position) {
          return;
        }
        if (!(position.top && position.left)) {
          return;
        }
        this.toolbar.css('top', position.top);
        return this.toolbar.css('left', position.left);
      },
      _bindEvents: function() {
        this.element.bind('halloselected', __bind(function(event, data) {
          var position;
          position = this._getPosition(data.originalEvent, data.selection);
          if (!position) {
            return;
          }
          this._updatePosition(position);
          return this.toolbar.show();
        }, this));
        this.element.bind('hallounselected', __bind(function(event, data) {
          return this.toolbar.hide();
        }, this));
        return this.element.bind('hallodeactivated', __bind(function(event, data) {
          return this.toolbar.hide();
        }, this));
      }
    });
  })(jQuery);
  (function(jQuery) {
    return jQuery.widget('Hallo.halloToolbarFixed', {
      toolbar: null,
      options: {
        parentElement: 'body',
        editable: null,
        toolbar: null
      },
      _create: function() {
        var el, widthToAdd;
        this.toolbar = this.options.toolbar;
        this.toolbar.show();
        jQuery(this.options.parentElement).append(this.toolbar);
        this._bindEvents();
        jQuery(window).resize(__bind(function(event) {
          return this._updatePosition(this._getPosition(event));
        }, this));
        if (this.options.parentElement === 'body' && !this.options.floating) {
          el = jQuery(this.element);
          widthToAdd = parseFloat(el.css('padding-left'));
          widthToAdd += parseFloat(el.css('padding-right'));
          widthToAdd += parseFloat(el.css('border-left-width'));
          widthToAdd += parseFloat(el.css('border-right-width'));
          widthToAdd += (parseFloat(el.css('outline-width'))) * 2;
          widthToAdd += (parseFloat(el.css('outline-offset'))) * 2;
          return jQuery(this.toolbar).css("width", el.width() + widthToAdd);
        }
      },
      _getPosition: function(event, selection) {
        var offset, position;
        if (!event) {
          return;
        }
        offset = parseFloat(this.element.css('outline-width')) + parseFloat(this.element.css('outline-offset'));
        return position = {
          top: this.element.offset().top - this.toolbar.outerHeight() - offset,
          left: this.element.offset().left - offset
        };
      },
      _getCaretPosition: function(range) {
        var newRange, position, tmpSpan;
        tmpSpan = jQuery("<span/>");
        newRange = rangy.createRange();
        newRange.setStart(range.endContainer, range.endOffset);
        newRange.insertNode(tmpSpan.get(0));
        position = {
          top: tmpSpan.offset().top,
          left: tmpSpan.offset().left
        };
        tmpSpan.remove();
        return position;
      },
      setPosition: function() {
        if (this.options.parentElement !== 'body') {
          return;
        }
        this.toolbar.css('position', 'absolute');
        this.toolbar.css('top', this.element.offset().top - this.toolbar.outerHeight());
        return this.toolbar.css('left', this.element.offset().left);
      },
      _updatePosition: function(position) {},
      _bindEvents: function() {
        this.element.bind('halloactivated', __bind(function(event, data) {
          this._updatePosition(this._getPosition(event));
          return this.toolbar.show();
        }, this));
        return this.element.bind('hallodeactivated', __bind(function(event, data) {
          return this.toolbar.hide();
        }, this));
      }
    });
  })(jQuery);
  (function(jQuery) {
    jQuery.widget('IKS.hallobutton', {
      button: null,
      isChecked: false,
      options: {
        uuid: '',
        label: null,
        icon: null,
        editable: null,
        command: null,
        queryState: true,
        cssClass: null
      },
      _create: function() {
        var hoverclass, id, _base, _ref;
                if ((_ref = (_base = this.options).icon) != null) {
          _ref;
        } else {
          _base.icon = "icon-" + (this.options.label.toLowerCase());
        };
        id = "" + this.options.uuid + "-" + this.options.label;
        this.button = this._createButton(id, this.options.command, this.options.label, this.options.icon);
        this.element.append(this.button);
        if (this.options.cssClass) {
          this.button.addClass(this.options.cssClass);
        }
        if (this.options.editable.options.touchScreen) {
          this.button.addClass('btn-large');
        }
        this.button.data('hallo-command', this.options.command);
        hoverclass = 'ui-state-hover';
        this.button.bind('mouseenter', __bind(function(event) {
          if (this.isEnabled()) {
            return this.button.addClass(hoverclass);
          }
        }, this));
        return this.button.bind('mouseleave', __bind(function(event) {
          return this.button.removeClass(hoverclass);
        }, this));
      },
      _init: function() {
        var editableElement, queryState;
        if (!this.button) {
          this.button = this._prepareButton();
        }
        this.element.append(this.button);
        queryState = __bind(function(event) {
          if (!this.options.command) {
            return;
          }
          try {
            return this.checked(document.queryCommandState(this.options.command));
          } catch (e) {

          }
        }, this);
        if (this.options.command) {
          this.button.bind('click', __bind(function(event) {
            this.options.editable.execute(this.options.command);
            queryState;
            return false;
          }, this));
        }
        if (!this.options.queryState) {
          return;
        }
        editableElement = this.options.editable.element;
        editableElement.bind('keyup paste change mouseup hallomodified', queryState);
        editableElement.bind('halloenabled', __bind(function() {
          return editableElement.bind('keyup paste change mouseup hallomodified', queryState);
        }, this));
        return editableElement.bind('hallodisabled', __bind(function() {
          return editableElement.unbind('keyup paste change mouseup hallomodified', queryState);
        }, this));
      },
      enable: function() {
        return this.button.removeAttr('disabled');
      },
      disable: function() {
        return this.button.attr('disabled', 'true');
      },
      isEnabled: function() {
        return this.button.attr('disabled') !== 'true';
      },
      refresh: function() {
        if (this.isChecked) {
          return this.button.addClass('ui-state-active');
        } else {
          return this.button.removeClass('ui-state-active');
        }
      },
      checked: function(checked) {
        this.isChecked = checked;
        return this.refresh();
      },
      _createButton: function(id, command, label, icon) {
        return jQuery("<button for=\"" + id + "\" class=\"ui-button ui-widget ui-state-default ui-corner-all ui-button-text-only " + command + "_button\" title=\"" + label + "\"><span class=\"ui-button-text\"><i class=\"" + icon + "\"></i></span></button>");
      }
    });
    return jQuery.widget('IKS.hallobuttonset', {
      buttons: null,
      _create: function() {
        return this.element.addClass('ui-buttonset');
      },
      _init: function() {
        return this.refresh();
      },
      refresh: function() {
        var rtl;
        rtl = this.element.css('direction') === 'rtl';
        this.buttons = this.element.find('.ui-button');
        this.buttons.hallobutton('refresh');
        this.buttons.removeClass('ui-corner-all ui-corner-left ui-corner-right');
        this.buttons.filter(':first').addClass(rtl ? 'ui-corner-right' : 'ui-corner-left');
        return this.buttons.filter(':last').addClass(rtl ? 'ui-corner-left' : 'ui-corner-right');
      }
    });
  })(jQuery);
  (function(jQuery) {
    return jQuery.widget('IKS.hallodropdownbutton', {
      button: null,
      options: {
        uuid: '',
        label: null,
        icon: null,
        editable: null,
        target: '',
        cssClass: null
      },
      _create: function() {
        var _base, _ref;
        return (_ref = (_base = this.options).icon) != null ? _ref : _base.icon = "icon-" + (this.options.label.toLowerCase());
      },
      _init: function() {
        var target;
        target = jQuery(this.options.target);
        target.css('position', 'absolute');
        target.addClass('dropdown-menu');
        target.hide();
        if (!this.button) {
          this.button = this._prepareButton();
        }
        this.button.bind('click', __bind(function() {
          if (target.hasClass('open')) {
            this._hideTarget();
            return;
          }
          return this._showTarget();
        }, this));
        target.bind('click', __bind(function() {
          return this._hideTarget();
        }, this));
        this.options.editable.element.bind('hallodeactivated', __bind(function() {
          return this._hideTarget();
        }, this));
        return this.element.append(this.button);
      },
      _showTarget: function() {
        var target;
        target = jQuery(this.options.target);
        this._updateTargetPosition();
        target.addClass('open');
        return target.show();
      },
      _hideTarget: function() {
        var target;
        target = jQuery(this.options.target);
        target.removeClass('open');
        return target.hide();
      },
      _updateTargetPosition: function() {
        var left, target, top, _ref;
        target = jQuery(this.options.target);
        _ref = this.button.position(), top = _ref.top, left = _ref.left;
        top += this.button.outerHeight();
        target.css('top', top);
        return target.css('left', left - 20);
      },
      _prepareButton: function() {
        var button, buttonEl, id;
        id = "" + this.options.uuid + "-" + this.options.label;
        buttonEl = jQuery("<button id=\"" + id + "\" data-toggle=\"dropdown\" data-target=\"#" + (this.options.target.attr('id')) + "\" title=\"" + this.options.label + "\">\n  <span class=\"ui-button-text\"><i class=\"" + this.options.icon + "\"></i></span>\n</button>");
        if (this.options.cssClass) {
          buttonEl.addClass(this.options.cssClass);
        }
        button = buttonEl.button();
        return button;
      }
    });
  })(jQuery);
}).call(this);
