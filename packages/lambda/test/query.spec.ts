'strict';

import { expect, test } from 'vitest';
import { Q } from '../lib/index';

interface TodoItem {
  completed: boolean;
  title: string;
}

test('x.completed ? "completed" : null', () => {
  const className = Q<TodoItem>().pick('completed').eq(true, 'completed');

  expect(
    className.call({ completed: true, title: 'start writing tests' })
  ).toBe('completed');

  expect(className.call({ completed: false, title: 'write tests' })).toBe(
    undefined
  );
});

test('assign', () => {
  type Event = {
    node: { checked: boolean };
    data: { completed?: boolean; title?: string; bla: boolean };
  };
  const event = Q<Event>();
  const data = event.pick('data');
  const node = event.pick('node').pick('checked').set(data.pick('completed'));

  const result = node.call({
    node: { checked: true },
    data: { completed: false },
  });
});
