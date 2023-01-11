import { jsxFactory, RenderContainer } from '@xania/view';
import { TodoApp } from '../../../src/examples/todo';
import classes from '../App.module.scss';
import { ViewResult } from './ViewResult';
import { Layout } from '../lib/layout/Layout';

const jsx = jsxFactory({ classes });

export function view() {
  return new ViewResult(
    (
      <Layout>
        <div class="App">
          <TodoApp />
        </div>
      </Layout>
    )
  );
}
