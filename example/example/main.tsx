import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Thing } from '../dist';

const App = () => {
  return (
    <div>
      <Thing />
      <Thing>test</Thing>
    </div>
  );
};

ReactDOM.render(<App />, document.getElementById('root'));
