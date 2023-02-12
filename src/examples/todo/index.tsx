import {
  jsxFactory,
  createListSource,
  ListSource,
  List,
  useContext,
  If,
  Css,
  Lazy,
  EventContext
} from "@xania/view";

import classes from "./index.module.scss";

const jsx = jsxFactory({ classes });

const items = createListSource<TodoItem>([
  {
    label: "hello",
    completed: true
  },
  {
    label: "hi",
    completed: false
  },
  {
    label: "hoi",
    completed: false
  }
]);

export function TodoApp() {
  return (
    <>
      <Css value="todoapp-container header" />
      <section class="todoapp">
        <div>
          <header class="header">
            <h1>todos</h1>
            <NewTodo onNew={(item) => items.append([item])} />
          </header>
          <TodoList />
          <If condition={items.map((l) => l.length > 0)}>
            <TodoFooter items={items} />
          </If>
        </div>
      </section>
    </>
  );
}

interface NewTodoProps {
  onNew(x: TodoItem): any;
}

function NewTodo(props: NewTodoProps) {
  const newTodoText = new Lazy("");
  function onNewTodoKeyUp(
    e: EventContext<TodoItem, KeyboardEvent, HTMLInputElement>
  ) {
    const label = e.event.target.value;
    if (e.event.key === "Enter" && label) {
      const newItem: TodoItem = {
        label,
        completed: false
      };
      props.onNew(newItem);
      newTodoText.select(e.event);
    }
  }
  return (
    <input
      class="new-todo"
      placeholder="What needs to be done?"
      value={newTodoText}
      keyup={onNewTodoKeyUp}
    />
  );
}

interface TodoListProps {
  items: ListSource<TodoItem>;
}

function TodoFooter(props: TodoListProps) {
  const { items } = props;

  function all(item: TodoItem) {
    return true;
  }

  function active(item: TodoItem) {
    return item.completed !== true;
  }

  function completed(item: TodoItem) {
    return item.completed === true;
  }

  return (
    <footer class="footer">
      <span class="todo-count">
        <strong>
          {items.map((l) => {
            const itemsLeft = l.filter((e) => !e.completed).length;
            return itemsLeft === 1 ? "1 item" : `${itemsLeft} items`;
          })}
        </strong>
        <span> left</span>
      </span>
      <ul class="filters">
        <li>
          <a class="selected" click={(_) => props.items.filter(all)}>
            All
          </a>
        </li>
        <span> </span>
        <li>
          <a click={() => props.items.filter(active)}>Active</a>
        </li>
        <span> </span>
        <li>
          <a click={() => props.items.filter(completed)}>Completed</a>
        </li>
      </ul>
    </footer>
  );
}

function TodoList() {
  const row = useContext<TodoItem>();
  const editing = row.lazy("editing");

  function select(e: EventContext<TodoItem>) {
    editing.select(e.data);
  }
  function setCompleted(e: EventContext<TodoItem, Event, HTMLInputElement>) {
    const data = e.data;
    data.completed = e.event.target.checked;
    items.update(() => [data]);
  }

  return (
    <ul class="todo-list">
      <List source={items}>
        {(row) => (
          <li
            class={[
              editing,
              row.map((x) => (x.completed ? "completed" : null))
            ]}
          >
            <div class="view">
              <input
                class="toggle"
                type="checkbox"
                checked={row.get("completed")}
                change={setCompleted}
              />
              <label dblclick={select}>{row.get("label")}</label>
              <button
                class="destroy"
                click={(e) => items.delete(e.data)}
              ></button>
            </div>
            <input
              class="edit"
              value={row.get("label")}
              blur={(evnt) => {
                // evnt.node.value = evnt.data.get("label");
                editing.clear();
              }}
              keyup={(evnt) => {
                if (evnt.event.key === "Enter") {
                  const target = evnt.event.target;
                  evnt.data.label = target.value;
                  items.update(() => [evnt.data]);
                  editing.clear();
                } else if (evnt.event.key === "Escape") {
                  editing.clear();
                }
              }}
            >
              {editing.attach(focusInput)}
              {/* {$((_, { key, node }) =>
              currentEditing.pipe(
                Ro.filter((x) => x === key),
                Ro.map(() => focusInput(node as HTMLInputElement))
              )
            )} */}
            </input>
          </li>
        )}
      </List>
    </ul>
  );
}

interface TodoItem {
  label: string;
  completed: boolean;
}

function focusInput(inputElt: HTMLInputElement) {
  setTimeout(() => {
    inputElt.focus();
    inputElt.setSelectionRange(0, inputElt.value.length);
  });
}
