import React from 'react';
import produce from 'immer';

export function shallowCompare(a, b) {
  if (!a && b) return false;
  if (a && !b) return false;
  if (a instanceof Array && a.length !== b.length) return false;
  const aKeys = Object.keys(a);
  if (aKeys.length !== Object.keys(b).length) return false;
  return aKeys.every(key => a[key] === b[key]);
}

export function debounce(interval, callback) {
  let timerId;
  return function (...args) {
    clearTimeout(timerId);
    timerId = setTimeout(callback, interval, ...args);
  };
}

export function create(initialState = {}) {
  let currentState = initialState;
  const subscribers = [];
  const app = function (update) {
    if (!arguments.length) return currentState;
    const newState = produce(currentState, draft => {
      update(draft);
    });
    if (newState !== currentState) {
      currentState = newState;
      console.log('state-changed', currentState);
      subscribers.forEach(subscriber => subscriber(currentState));
    }
    return app;
  };

  function invoke(action, ...args) {
    return action(app, ...args);
  }

  function subscribe(subscriber) {
    subscribers.push(subscriber);
    return function () {
      const index = subscribers.indexOf(subscriber);
      if (index !== -1) {
        subscribers.splice(index, 1);
      }
    };
  }

  function async(statusUpdate, promise) {
    const timerId = setTimeout(() =>
      app(state =>
        statusUpdate(state, {
          status: 'loading',
          payload: undefined
        })
      )
    );

    if (!promise || !promise.then) {
      promise = Promise.resolve(promise);
    }

    return promise.then(payload => {
      clearTimeout(timerId);
      app(state =>
        statusUpdate(state, {
          status: 'loaded',
          payload
        })
      );
    }, ex => {
      clearTimeout(timerId);
      app(state =>
        statusUpdate(state, {
          status: 'failed',
          error: ex
        })
      );
    });
  }

  /**
   * create a component with specific stateToProps callback
   * the component will update once app state changed
   */
  function component(stateToProps, Component) {
    return class ComponentWrapper extends React.Component {
      constructor(...args) {
        super(...args);

        this.updateProp(this.props);
      }

      updateProp(props) {
        const {onDidMount, onWillUnmount, onRender, ...mappedProps} =
        stateToProps(currentState, props, {
          state: this.state,
          invoke,
          invoker(action, ...defaltArgs) {
            const invokerData = {action, args: defaltArgs};
            if (
              action[invokerData] &&
              invokerData.action === action &&
              shallowCompare(defaltArgs, action[invokerData].args)
            )
              return action[invokerData];
            action[invokerData] = invokerData;
            return function (...args) {
              return invoke(action, ...defaltArgs.concat(args));
            };
          }
        }) || props;
        Object.assign(this, {
          onDidMount,
          onWillUnmount,
          onRender
        });
        const hasChange = !shallowCompare(mappedProps, this.mappedProps);
        if (hasChange) {
          this.mappedProps = mappedProps;
        }
        return hasChange;
      }

      componentDidMount() {
        if (this.onDidMount) {
          this.onDidMount(this);
        }
        this.unsubscribe = subscribe(() => {
          if (!this.updateProp(this.props)) return false;
          this.forceUpdate();
        });
      }

      componentWillUnmount() {
        if (this.onWillUnmount) {
          this.onWillUnmount(this);
        }
        this.unsubscribe();
      }

      shouldComponentUpdate(nextProps) {
        return this.updateProp(nextProps);
      }

      render() {
        if (this.onRender) {
          this.onRender(this);
        }
        return React.createElement(Component, this.mappedProps);
      }
    };
  }

  return Object.assign(app, {
    subscribe,
    component,
    async,
    invoke
  });
}