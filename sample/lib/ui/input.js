goog.provide('ui.Input');

goog.require('goog.ui.Component');

/**
 * @param {string=} opt_value The value string.
 * @constructor
 * @extends {goog.ui.Component}
 */
ui.Input = function(opt_value) {
  goog.ui.Component.call(this);
  this.value_ = opt_value || '';
};
goog.inherits(ui.Input, goog.ui.Component);

/**
 * @override
 */
ui.Input.prototype.createDom = function() {
  var dom = this.getDomHelper();
  var el = dom.createDom('input', {
    'className': 'ui-input',
      'type': 'text',
      'value': ''
  });
  this.setElementInternal(el);
};

/**
 * @override
 */
ui.Input.prototype.enterDocument = function() {
  goog.base(this, 'enterDocument');
  var el = this.getElement();
  el.value = this.value_;
};

/**
 * @param {string} value The value string.
 */
ui.Input.prototype.setValue = function(value) {
  if (this.isInDocument()) {
    var el = this.getElement();
    el.value = value;
  }
  this.value_ = value;
};

/**
 * @return {string}
 */
ui.Input.prototype.getValue = function() {
  return this.value_;
};
