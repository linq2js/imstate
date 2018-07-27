# imstate
An application state management and more

## Samples:

```jsx
    import React from 'react';
    import { render } from 'react-dom';
    import { create } from 'imstate';

    const app = create({
      todos: []
    });
    
    const impureAction = (text) => app(state => state.todos.push({ text }));
    const pureAction = ($state, text) => $state(state => state.todos.push({ text }));
    
    const App = app.component(
      (state, props, { invoke }) => ({ todos: state.todo, invokte }),
      props => {
        const { todos, invoke } = props;
        let input;
        
        function handlePureClick() {
          invoke(pureAction, input.value);
        }
        
        function handleImpureClick() {
          impureAction(input.value)
        }
        
        return (
          <div>
            <input type="text" ref={node => input = node}/>
            <button onClick={handlePureClick}>Pure Action</button>
            <button onClick={handleImpureClick}>Impure Action</button>
            <ul>
                {todos.map((todo, index) => <li key={index}>{todo.text}</li>)}
            </ul>
          </div>
        );
      }
    );
    
    render(<App/>, document.getEleementById('root'));
```