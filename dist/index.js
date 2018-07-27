'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

exports.shallowCompare = shallowCompare;
exports.debounce = debounce;
exports.create = create;

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _immer = require('immer');

var _immer2 = _interopRequireDefault(_immer);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _objectWithoutProperties(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) continue; if (!Object.prototype.hasOwnProperty.call(obj, i)) continue; target[i] = obj[i]; } return target; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function shallowCompare(a, b) {
  if (!a && b) return false;
  if (a && !b) return false;
  if (a instanceof Array && a.length !== b.length) return false;
  var aKeys = Object.keys(a);
  if (aKeys.length !== Object.keys(b).length) return false;
  return aKeys.every(function (key) {
    return a[key] === b[key];
  });
}

function debounce(interval, callback) {
  var timerId = void 0;
  return function () {
    clearTimeout(timerId);

    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    timerId = setTimeout.apply(undefined, [callback, interval].concat(args));
  };
}

function create() {
  var initialState = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

  var currentState = initialState;
  var subscribers = [];
  var app = function app(update) {
    if (!arguments.length) return currentState;
    var newState = (0, _immer2.default)(currentState, function (draft) {
      update(draft);
    });
    if (newState !== currentState) {
      currentState = newState;
      console.log('state-changed', currentState);
      subscribers.forEach(function (subscriber) {
        return subscriber(currentState);
      });
    }
    return app;
  };

  function invoke(action) {
    for (var _len2 = arguments.length, args = Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
      args[_key2 - 1] = arguments[_key2];
    }

    return action.apply(undefined, [app].concat(args));
  }

  function subscribe(subscriber) {
    subscribers.push(subscriber);
    return function () {
      var index = subscribers.indexOf(subscriber);
      if (index !== -1) {
        subscribers.splice(index, 1);
      }
    };
  }

  function async(statusUpdate, promise) {
    var timerId = setTimeout(function () {
      return app(function (state) {
        return statusUpdate(state, {
          status: 'loading',
          payload: undefined
        });
      });
    });

    if (!promise || !promise.then) {
      promise = Promise.resolve(promise);
    }

    return promise.then(function (payload) {
      clearTimeout(timerId);
      app(function (state) {
        return statusUpdate(state, {
          status: 'loaded',
          payload: payload
        });
      });
    }, function (ex) {
      clearTimeout(timerId);
      app(function (state) {
        return statusUpdate(state, {
          status: 'failed',
          error: ex
        });
      });
    });
  }

  /**
   * create a component with specific stateToProps callback
   * the component will update once app state changed
   */
  function component(stateToProps, Component) {
    return function (_React$Component) {
      _inherits(ComponentWrapper, _React$Component);

      function ComponentWrapper() {
        var _ref;

        _classCallCheck(this, ComponentWrapper);

        for (var _len3 = arguments.length, args = Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
          args[_key3] = arguments[_key3];
        }

        var _this = _possibleConstructorReturn(this, (_ref = ComponentWrapper.__proto__ || Object.getPrototypeOf(ComponentWrapper)).call.apply(_ref, [this].concat(args)));

        _this.updateProp(_this.props);
        return _this;
      }

      _createClass(ComponentWrapper, [{
        key: 'updateProp',
        value: function updateProp(props) {
          var _ref2 = stateToProps(currentState, props, {
            state: this.state,
            invoke: invoke,
            invoker: function invoker(action) {
              for (var _len4 = arguments.length, defaltArgs = Array(_len4 > 1 ? _len4 - 1 : 0), _key4 = 1; _key4 < _len4; _key4++) {
                defaltArgs[_key4 - 1] = arguments[_key4];
              }

              var invokerData = { action: action, args: defaltArgs };
              if (action[invokerData] && invokerData.action === action && shallowCompare(defaltArgs, action[invokerData].args)) return action[invokerData];
              action[invokerData] = invokerData;
              return function () {
                for (var _len5 = arguments.length, args = Array(_len5), _key5 = 0; _key5 < _len5; _key5++) {
                  args[_key5] = arguments[_key5];
                }

                return invoke.apply(undefined, [action].concat(_toConsumableArray(defaltArgs.concat(args))));
              };
            }
          }) || props,
              onDidMount = _ref2.onDidMount,
              onWillUnmount = _ref2.onWillUnmount,
              onRender = _ref2.onRender,
              mappedProps = _objectWithoutProperties(_ref2, ['onDidMount', 'onWillUnmount', 'onRender']);

          Object.assign(this, {
            onDidMount: onDidMount,
            onWillUnmount: onWillUnmount,
            onRender: onRender
          });
          var hasChange = !shallowCompare(mappedProps, this.mappedProps);
          if (hasChange) {
            this.mappedProps = mappedProps;
          }
          return hasChange;
        }
      }, {
        key: 'componentDidMount',
        value: function componentDidMount() {
          var _this2 = this;

          if (this.onDidMount) {
            this.onDidMount(this);
          }
          this.unsubscribe = subscribe(function () {
            if (!_this2.updateProp(_this2.props)) return false;
            _this2.forceUpdate();
          });
        }
      }, {
        key: 'componentWillUnmount',
        value: function componentWillUnmount() {
          if (this.onWillUnmount) {
            this.onWillUnmount(this);
          }
          this.unsubscribe();
        }
      }, {
        key: 'shouldComponentUpdate',
        value: function shouldComponentUpdate(nextProps) {
          return this.updateProp(nextProps);
        }
      }, {
        key: 'render',
        value: function render() {
          if (this.onRender) {
            this.onRender(this);
          }
          return _react2.default.createElement(Component, this.mappedProps);
        }
      }]);

      return ComponentWrapper;
    }(_react2.default.Component);
  }

  return Object.assign(app, {
    subscribe: subscribe,
    component: component,
    async: async,
    invoke: invoke
  });
}
//# sourceMappingURL=index.js.map